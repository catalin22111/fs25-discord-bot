// ======================================================
// FS25 Discord Channel Renamer (Render-safe version)
// Auto-updates a Discord channel name with player count
// Author: ChatGPT helper package for "RoFarm Romania"
// ======================================================

const { Client, GatewayIntentBits, ChannelType } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const express = require("express");

// ---------------------------------------------------------------------------
// Load config from file (local fallback) and/or environment variables
// ---------------------------------------------------------------------------
let config = {};
if (fs.existsSync("config.json")) {
  try {
    config = JSON.parse(fs.readFileSync("config.json", "utf8"));
  } catch (err) {
    console.error("Could not read config.json:", err);
  }
}

config.token = process.env.TOKEN || config.token;
config.serverUrl = process.env.SERVER_URL || config.serverUrl;
config.channelId = process.env.CHANNEL_ID || config.channelId;
config.interval = Number(process.env.INTERVAL || config.interval || 60);

// Basic validation
if (!config.token || !config.serverUrl || !config.channelId) {
  console.error("❌ Missing configuration (token/serverUrl/channelId)");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Keep-alive web server (important for Render/UptimeRobot)
// ---------------------------------------------------------------------------
const app = express();
app.get("/", (req, res) => res.send("✅ RoFarm FS25 Bot is alive!"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Keep-alive server running on port ${PORT}`));

// ---------------------------------------------------------------------------
// Discord bot setup
// ---------------------------------------------------------------------------
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function fetchStats() {
  try {
    const resp = await axios.get(config.serverUrl, { timeout: 8000 });
    const xml = String(resp.data);

    // Simple XML tag parser
    const get = (tag) => {
      const m = xml.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "i"));
      return m ? m[1] : null;
    };

    const players = (xml.match(/<Player isUsed="true"/g) || []).length;
    const slots = Number(get("Slots")?.match(/capacity="(\d+)"/)?.[1] || 0) || 0;
    const name = get("name") || "FS25 Server";

    return { players, slots, name };
  } catch (err) {
    console.error("Error fetching server stats:", err.message);
    return null;
  }
}

async function updateChannel() {
  try {
    const stats = await fetchStats();
    if (!stats) return;

    const { players, slots, name } = stats;
    const channel = await client.channels.fetch(config.channelId);

    if (!channel) {
      console.error("❌ Channel not found. Check CHANNEL_ID and bot permissions.");
      return;
    }

    const newName = `🟢 Active Players - (${players}/${slots})`;
    if (channel.name !== newName) {
      await channel.setName(newName);
      console.log(`[${new Date().toISOString()}] ✅ Updated channel name to: ${newName}`);
    } else {
      console.log(`[${new Date().toISOString()}] ℹ️ No change (${newName})`);
    }

    // Optional bot status
    client.user.setActivity(`${name}: ${players}/${slots}`, { type: 0 });
  } catch (err) {
    console.error("Error updating channel:", err.message);
  }
}

client.once("ready", () => {
  console.log(`[FS25] ✅ Bot connected as ${client.user.tag}`);
  updateChannel();
  setInterval(updateChannel, config.interval * 1000);
});

client.login(config.token);
