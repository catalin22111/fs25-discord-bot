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
// ----------------------------------------------------------------------
