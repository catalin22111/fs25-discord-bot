// =====================================================
// FS25 Discord Channel Renamer — RoFarm Romania Edition
// Includes Glitch keep-alive web server
// =====================================================

// --- Web server to keep Glitch awake ---
const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("✅ RoFarm FS25 Bot is alive and running!"));
app.listen(3000, () => console.log("🌐 Glitch keep-alive server started on port 3000"));

// --- Discord + FS25 Bot ---
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require("discord.js");
const axios = require("axios");
const fs = require("fs");

const CONFIG_PATH = "config.json";
if (!fs.existsSync(CONFIG_PATH)) {
  console.error("Missing config.json. Please create it (see README.md).");
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

// Basic validation
["token", "serverUrl", "channelId", "interval"].forEach(k => {
  if (!config[k] || String(config[k]).trim() === "") {
    console.error(`config.json is missing "${k}". Please fill it.`);
    process.exit(1);
  }
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- Fetch stats from FS25 dedicated server XML ---
async function fetchStats() {
  const resp = await axios.get(config.serverUrl, { timeout: 8000 });
  const xml = String(resp.data || "");

  // helper for regex
  const first = (patterns) => {
    for (const p of patterns) {
      const m = xml.match(p);
      if (m) return m[1];
    }
    return null;
  };

  // players: look for <Slots numUsed="...">
  let playersStr = first([
    /<Slots[^>]*\bnumUsed\s*=\s*"(\d+)"/i,
    /<players>\s*(\d+)\s*<\/players>/i,
    /\bplayers\s*=\s*"(\d+)"/i,
    /\bcurrent\s*=\s*"(\d+)"/i,
    /\bcount\s*=\s*"(\d+)"/i
  ]);

  // fallback: count Player tags with isUsed="true"
  if (playersStr == null) {
    const active = xml.match(/<Player[^>]*\bisUsed\s*=\s*"true"/gi);
    playersStr = active ? String(active.length) : "0";
  }

  // slots: look for <Slots capacity="...">
  const slotsStr = first([
    /<Slots[^>]*\bcapacity\s*=\s*"(\d+)"/i,
    /<slots>\s*(\d+)\s*<\/slots>/i,
    /\bmax\s*=\s*"(\d+)"/i,
    /\bslots\s*=\s*"(\d+)"/i,
    /\bcapacity\s*=\s*"(\d+)"/i
  ]);

  // server name
  const nameStr = first([
    /\bname\s*=\s*"([^"]+)"/i,
    /<name>\s*([^<]+)\s*<\/name>/i
  ]) || "FS25 Server";

  const players = Number(playersStr || 0);
  const slots = Number(slotsStr || 0);
  return { players, slots, name: nameStr };
}

// --- Rename channel ---
async function updateChannel() {
  try {
    const { players, slots, name } = await fetchStats();
    const channel = await client.channels.fetch(config.channelId);

    if (!channel) {
      console.error("Channel not found. Check channelId and bot permissions.");
      return;
    }

    const perms = channel.permissionsFor(client.user);
    if (!perms?.has(PermissionsBitField.Flags.ManageChannels)) {
      console.error("Bot lacks Manage Channels permission.");
      return;
    }

    const newName = `🟢 Active Players - (${players}/${slots})`;

    if (channel.name !== newName) {
      await channel.setName(newName);
      console.log(`[${new Date().toISOString()}] Updated channel name → ${newName}`);
    } else {
      console.log(`[${new Date().toISOString()}] No change (${newName})`);
    }

    // optional: show live stats in bot status
    await client.user.setActivity(`${name}: ${players}/${slots}`, { type: 0 });

  } catch (err) {
    console.error("Error during update:", err.message);
  }
}

client.once("ready", () => {
  console.log(`[FS25] Bot connected as ${client.user.tag}`);
  updateChannel();
  setInterval(updateChannel, Number(config.interval) * 1000);
});

client.login(config.token);
