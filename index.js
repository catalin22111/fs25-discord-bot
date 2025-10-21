// ======================================================
// FS25 Discord Channel Renamer — Render + Debug Edition
// ======================================================

const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const express = require("express");

// ----------------------- Config (env first, then file) -----------------------
let config = {};
if (fs.existsSync("config.json")) {
  try { config = JSON.parse(fs.readFileSync("config.json","utf8")); }
  catch (e) { console.error("Could not read config.json:", e.message); }
}
config.token     = process.env.TOKEN      || config.token;
config.serverUrl = process.env.SERVER_URL || config.serverUrl;
config.channelId = process.env.CHANNEL_ID || config.channelId;
config.interval  = Number(process.env.INTERVAL || config.interval || 60);

// quick sanity log (values masked)
console.log("Config check:",
  {
    token: config.token ? "✅ set" : "❌ missing",
    serverUrl: config.serverUrl || "❌ missing",
    channelId: config.channelId || "❌ missing",
    interval: config.interval
  }
);

if (!config.token || !config.serverUrl || !config.channelId) {
  console.error("❌ Missing required config (TOKEN / SERVER_URL / CHANNEL_ID). Exiting.");
  process.exit(1);
}

// ----------------------- Keep-alive web server -----------------------
const app = express();
let lastStats = { players: null, slots: null, name: null, updatedAt: null, lastError: null };
app.get("/", (_req, res) => res.send("✅ FS25 Discord Bot is alive"));
app.get("/health", (_req, res) => res.json(lastStats));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Keep-alive server on port ${PORT}`));

// ----------------------- Discord client -----------------------
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ----------------------- XML fetch & parse -----------------------
async function fetchStats() {
  try {
    const resp = await axios.get(config.serverUrl, { timeout: 8000, headers: { "User-Agent": "fs25-discord-bot/1.0" } });
    const xml = String(resp.data || "");

    // read from opening <Slots ...> tag
    const capMatch     = xml.match(/<Slots[^>]*\bcapacity="(\d+)"/i);
    const numUsedMatch = xml.match(/<Slots[^>]*\bnumUsed="(\d+)"/i);

    let players = numUsedMatch ? Number(numUsedMatch[1]) : (xml.match(/<Player[^>]*\bisUsed="true"/gi) || []).length;
    const slots = capMatch ? Number(capMatch[1]) : 0;

    const nameMatch = xml.match(/\bname="([^"]+)"/i) || xml.match(/<name>\s*([^<]+)\s*<\/name>/i);
    const name = nameMatch ? nameMatch[1] : "FS25 Server";

    lastStats = { players, slots, name, updatedAt: new Date().toISOString(), lastError: null };
    console.log(`📊 Stats → players=${players} slots=${slots} name="${name}"`);
    return { players, slots, name };
  } catch (err) {
    lastStats.lastError = err.message;
    console.error("🌩️ fetchStats error:", err.message);
    return null;
  }
}

// ----------------------- Channel updater -----------------------
async function updateChannel() {
  try {
    const stats = await fetchStats();
    if (!stats) return;

    const { players, slots, name } = stats;

    let channel;
    try {
      channel = await client.channels.fetch(config.channelId);
    } catch (e) {
      console.error("❌ Failed to fetch channel. Check CHANNEL_ID and bot 'View Channel' access.", e.message);
      return;
    }
    if (!channel) {
      console.error("❌ Channel not found.");
      return;
    }

    const perms = channel.permissionsFor(client.user);
    if (!perms?.has(PermissionsBitField.Flags.ManageChannels)) {
      console.error("❌ Bot lacks 'Manage Channels' permission on that channel.");
      return;
    }

    const newName = `🟢 Active Players - (${players}/${slots})`;
    if (channel.name !== newName) {
      await channel.setName(newName);
      console.log(`✅ Renamed channel to: ${newName}`);
    } else {
      console.log(`ℹ️ No change (already: ${newName})`);
    }

    client.user.setActivity(`${name}: ${players}/${slots}`, { type: 0 });
  } catch (err) {
    console.error("🌩️ updateChannel error:", err.message);
  }
}

// ----------------------- Boot -----------------------
client.once("ready", () => {
  console.log(`[FS25] ✅ Bot connected as ${client.user.tag}`);
  // immediate run + interval
  updateChannel();
  setInterval(updateChannel, config.interval * 1000);
});

client.login(config.token).catch(err => {
  console.error("❌ Login failed (invalid token or gateway issue):", err.message);
  process.exit(1);
});
