import fs from "node:fs";

import {
  connecterWhatsApp,
  getSocket,
  estConnecte,
  deconnecterWhatsApp
} from "./whatsapp.js";

import {
  BOT_NAME,
  MENU_IMAGE,
  nettoyerNumero,
  estAutorise
} from "./config.js";

const attenteNumero = new Set();

function chatPrive(ctx) {
  return ctx.chat?.type === "private";
}

function utilisateurAutorise(ctx) {
  return estAutorise(ctx.from?.id);
}

export function registerCommands(bot) {

  // =========================
  // /start
  // =========================

  bot.start(async ctx => {

    if (!chatPrive(ctx)) {
      return ctx.reply(
        "🔒 Utilisez le bot dans une conversation privée."
      );
    }

    const texte =
      `👑 ${BOT_NAME} — BOT OFFICIEL\n\n` +
      `🌑 DARK PURGE KINDOM\n\n` +
      `🔐 /pair — Connecter WhatsApp\n` +
      `📊 /status — Vérifier la connexion\n` +
      `🔌 /logout — Déconnecter WhatsApp\n` +
      `ℹ️ /help — Aide\n\n` +
      `⚡ Telegram → Code de pairing → WhatsApp`;

    if (
      fs.existsSync(
        MENU_IMAGE
      )
    ) {

      await ctx.replyWithPhoto(
        {
          source: MENU_IMAGE
        },
        {
          caption: texte
        }
      );

    } else {

      await ctx.reply(texte);

    }
  });

  // =========================
  // /help
  // =========================

  bot.help(async ctx => {

    await ctx.reply(
      `👑 ${BOT_NAME} — AIDE\n\n` +
      `/start — Menu principal\n` +
      `/pair — Commencer le pairing\n` +
      `/status — Voir le statut\n` +
      `/logout — Déconnecter WhatsApp\n\n` +
      `📱 Pour /pair, envoyez votre numéro WhatsApp avec l'indicatif du pays.\n\n` +
      `Exemple : 509XXXXXXXX`
    );
  });

  // =========================
  // /pair
  // =========================

  bot.command(
    "pair",
    async ctx => {

      if (!chatPrive(ctx)) {
        return ctx.reply(
          "🔒 /pair est disponible uniquement en conversation privée."
        );
      }

      if (!utilisateurAutorise(ctx)) {
        return ctx.reply(
          "⛔ Vous n'êtes pas autorisé à utiliser ce bot."
        );
      }

      attenteNumero.add(
        String(ctx.from.id)
      );

      await ctx.reply(
        "🔐 DPK — PAIRING WHATSAPP\n\n" +
        "📱 Envoyez maintenant votre numéro WhatsApp.\n\n" +
        "Exemple :\n" +
        "`509XXXXXXXX`\n\n" +
        "⚠️ N'ajoutez pas le signe +, les espaces ou les tirets.",
        {
          parse_mode: "Markdown"
        }
      );
    }
  );

  // =========================
  // /status
  // =========================

  bot.command(
    "status",
    async ctx => {

      if (!chatPrive(ctx)) {
        return;
      }

      if (!utilisateurAutorise(ctx)) {
        return ctx.reply(
          "⛔ Vous n'êtes pas autorisé."
        );
      }

      const socket =
        getSocket(ctx.from.id);

      if (
        estConnecte(
          ctx.from.id
        )
      ) {

        const numero =
          socket.user?.id
            ?.split(":")[0] ||
          "inconnu";

        return ctx.reply(
          `🟢 WHATSAPP — EN LIGNE\n\n` +
          `👑 Bot : ${BOT_NAME}\n` +
          `📱 Numéro : ${numero}\n` +
          `🔗 Telegram : EN LIGNE`
        );
      }

      await ctx.reply(
        "🔴 WHATSAPP — HORS LIGNE\n\n" +
        "Utilisez /pair pour connecter un compte WhatsApp."
      );
    }
  );

  // =========================
  // /logout
  // =========================

  bot.command(
    "logout",
    async ctx => {

      if (!chatPrive(ctx)) {
        return;
      }

      if (!utilisateurAutorise(ctx)) {
        return ctx.reply(
          "⛔ Vous n'êtes pas autorisé."
        );
      }

      if (
        !getSocket(ctx.from.id)
      ) {
        return ctx.reply(
          "ℹ️ Aucune session WhatsApp active."
        );
      }

      await ctx.reply(
        "🔌 Déconnexion de WhatsApp en cours..."
      );

      await deconnecterWhatsApp(
        ctx.from.id
      );

      await ctx.reply(
        "✅ WhatsApp a été déconnecté et la session a été supprimée."
      );
    }
  );

  // =========================
  // Réception du numéro
  // =========================

  bot.on(
    "text",
    async ctx => {

      if (!chatPrive(ctx)) {
        return;
      }

      if (!utilisateurAutorise(ctx)) {
        return;
      }

      const id =
        String(ctx.from.id);

      if (
        !attenteNumero.has(id)
      ) {
        return;
      }

      if (
        ctx.message.text
          .startsWith("/")
      ) {
        return;
      }

      attenteNumero.delete(id);

      const numero =
        nettoyerNumero(
          ctx.message.text
        );

      if (
        !numero ||
        numero.length < 7
      ) {

        return ctx.reply(
          "❌ Numéro invalide.\n\n" +
          "Exemple : `509XXXXXXXX`",
          {
            parse_mode: "Markdown"
          }
        );
      }

      await ctx.reply(
        "⏳ Préparation de la connexion WhatsApp...\n" +
        "Veuillez patienter quelques secondes."
      );

      try {

        const resultat =
          await connecterWhatsApp(
            id,
            {
              numero,

              onOpen: async () => {
                try {
                  await ctx.telegram.sendMessage(
                    ctx.chat.id,
                    "✅ WhatsApp est maintenant connecté avec succès !"
                  );
                } catch {}
              }
            }
          );

        if (resultat.code) {

          await ctx.reply(
            `🔑 CODE DE PAIRING DPK\n\n` +
            `\`${resultat.code}\`\n\n` +
            `📱 Sur WhatsApp :\n` +
            `Paramètres → Appareils connectés → Connecter un appareil → Connecter avec un numéro de téléphone.\n\n` +
            `⚠️ Ne partagez jamais votre code de pairing.`,
            {
              parse_mode: "Markdown"
            }
          );

        } else {

          await ctx.reply(
            "ℹ️ La session WhatsApp est déjà en cours de connexion.\n" +
            "Utilisez /status dans quelques secondes."
          );
        }

      } catch (error) {

        console.error(
          "Erreur pairing :",
          error
        );

        await ctx.reply(
          `❌ Le pairing a échoué.\n\n` +
          `Raison : ${
            error?.message ||
            "Erreur inconnue"
          }\n\n` +
          `Utilisez /pair pour réessayer.`
        );
      }
    }
  );
}