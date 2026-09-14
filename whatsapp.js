import fs from "node:fs";

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers
} from "@whiskeysockets/baileys";

import Pino from "pino";

import {
  getSessionPath,
  nettoyerNumero,
  SESSIONS_DIR
} from "./config.js";

const logger = Pino({
  level: process.env.LOG_LEVEL || "info"
});

const sockets = new Map();
const connexions = new Map();

const attendre = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

export function getSocket(telegramUserId) {
  return sockets.get(
    String(telegramUserId)
  );
}

export function estConnecte(telegramUserId) {
  const socket = getSocket(telegramUserId);

  return Boolean(socket?.user);
}

export async function connecterWhatsApp(
  telegramUserId,
  options = {}
) {
  const id = String(telegramUserId);

  if (connexions.has(id)) {
    return connexions.get(id);
  }

  const promesse = (async () => {
    const dossierSession =
      getSessionPath(id);

    fs.mkdirSync(dossierSession, {
      recursive: true
    });

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(
      dossierSession
    );

    const socket = makeWASocket({
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: Browsers.macOS("DPK"),
      markOnlineOnConnect: false
    });

    sockets.set(id, socket);

    socket.ev.on(
      "creds.update",
      saveCreds
    );

    socket.ev.on(
      "connection.update",
      async ({
        connection,
        lastDisconnect
      }) => {

        if (connection === "open") {
          console.log(
            `✅ WhatsApp connecté : ${id}`
          );

          if (options.onOpen) {
            await options.onOpen(socket);
          }
        }

        if (connection === "close") {
          sockets.delete(id);

          const code =
            lastDisconnect?.error
              ?.output?.statusCode;

          if (
            code === DisconnectReason.loggedOut
          ) {
            console.log(
              `🔌 WhatsApp déconnecté : ${id}`
            );

            fs.rmSync(
              dossierSession,
              {
                recursive: true,
                force: true
              }
            );

            if (options.onLogout) {
              await options.onLogout();
            }

          } else {
            console.log(
              `🔄 Reconnexion WhatsApp : ${id}`
            );

            setTimeout(() => {
              connecterWhatsApp(
                id,
                options
              ).catch(console.error);
            }, 3000);
          }
        }
      }
    );

    if (
      !state.creds.registered &&
      options.numero
    ) {
      await attendre(1500);

      const numero =
        nettoyerNumero(
          options.numero
        );

      if (!numero || numero.length < 7) {
        throw new Error(
          "Numéro WhatsApp invalide."
        );
      }

      const code =
        await socket.requestPairingCode(
          numero
        );

      return {
        socket,
        code
      };
    }

    return {
      socket,
      code: null
    };
  })();

  connexions.set(id, promesse);

  try {
    return await promesse;
  } finally {
    connexions.delete(id);
  }
}

export async function deconnecterWhatsApp(
  telegramUserId
) {
  const id =
    String(telegramUserId);

  const socket =
    sockets.get(id);

  try {
    if (socket) {
      await socket.logout();
    }
  } catch (error) {
    console.warn(
      "Avertissement déconnexion :",
      error?.message || error
    );
  }

  sockets.delete(id);

  const dossierSession =
    getSessionPath(id);

  fs.rmSync(
    dossierSession,
    {
      recursive: true,
      force: true
    }
  );
}

export function listerSessions() {
  if (
    !fs.existsSync(
      SESSIONS_DIR
    )
  ) {
    return [];
  }

  return fs
    .readdirSync(
      SESSIONS_DIR,
      {
        withFileTypes: true
      }
    )
    .filter(
      entry =>
        entry.isDirectory()
    )
    .map(
      entry =>
        entry.name
    );
}

export async function restoreSessions(bot) {
  for (
    const id of listerSessions()
  ) {
    try {
      await connecterWhatsApp(
        id,
        {
          onOpen: async () => {
            try {
              await bot.telegram.sendMessage(
                id,
                "✅ Votre session WhatsApp DPK a été reconnectée avec succès."
              );
            } catch {}
          }
        }
      );
    } catch (error) {
      console.error(
        `Erreur restauration ${id} :`,
        error?.message || error
      );
    }
  }
}