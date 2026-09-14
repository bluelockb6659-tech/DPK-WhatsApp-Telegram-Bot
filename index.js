import "dotenv/config";
import { Telegraf } from "telegraf";
import { registerCommands } from "./src/commands.js";
import { restoreSessions } from "./src/whatsapp.js";

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error("❌ BOT_TOKEN manquant dans le fichier .env");
  process.exit(1);
}

const bot = new Telegraf(token);

bot.catch(async (error, ctx) => {
  console.error("Erreur Telegram :", error);

  try {
    await ctx.reply("❌ Une erreur est survenue. Veuillez réessayer.");
  } catch {}
});

registerCommands(bot);

await restoreSessions(bot);

await bot.launch();

console.log("=================================");
console.log("       DPK WHATSAPP BOT");
console.log("       TELEGRAM PAIRING");
console.log("       BOT EN LIGNE ✅");
console.log("=================================");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));