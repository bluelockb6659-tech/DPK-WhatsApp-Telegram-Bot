import fs from "node:fs";
import path from "node:path";

export const BOT_NAME = process.env.BOT_NAME || "DPK";

export const SESSIONS_DIR = path.join(
  process.cwd(),
  "sessions"
);

export const MENU_IMAGE = path.join(
  process.cwd(),
  "assets",
  "menu.png"
);

fs.mkdirSync(SESSIONS_DIR, {
  recursive: true
});

export function nettoyerNumero(numero) {
  return String(numero || "").replace(/\D/g, "");
}

export function getSessionPath(telegramUserId) {
  return path.join(
    SESSIONS_DIR,
    String(telegramUserId)
  );
}

export function estAutorise(telegramUserId) {
  const raw = String(
    process.env.OWNER_IDS || ""
  ).trim();

  if (!raw) return true;

  return raw
    .split(",")
    .map(id => id.trim())
    .includes(String(telegramUserId));
}