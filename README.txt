# 🌾 FS25 Discord Player Count Bot

A simple Node.js bot that automatically updates a Discord voice channel name to show the number of **active players** on a **Farming Simulator 25** server.  
Works perfectly with **G-Portal** or any dedicated server exposing an XML stats feed.

---

## ✨ Features

- 🟢 Displays current player count like:  
  `🟢 Active Players - (3/16)`
- 🔁 Auto-refreshes at your chosen interval
- 🌐 Supports **Render.com** hosting (always online)
- ⚙️ Configurable via environment variables
- 📊 `/health` endpoint to check the latest stats

---

## ⚙️ Setup Guide

### 1️⃣ Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a **New Application** → go to the **Bot** tab
3. Enable:
   - ✅ `MESSAGE CONTENT INTENT`
   - ✅ `SERVER MEMBERS INTENT`
4. Copy your **Bot Token**

### 2️⃣ Invite Bot to Your Server

Use this link format:  
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=268435456

> The `Manage Channels` permission (268435456) allows renaming the channel.

---

## ⚡ Environment Variables

| Name | Description | Example |
|------|--------------|----------|
| TOKEN | Discord Bot Token | MTExxxx.yyyy.zzzz |
| SERVER_URL | FS25 server XML feed URL | http://147.93.162.161:8100/feed/dedicated-server-stats.xml?code=n6wkUxafdOTqFamI |
| CHANNEL_ID | Discord voice channel ID to rename | 128761823781726213 |
| INTERVAL | Update interval in seconds | 10 |

---

## 🚀 Running Locally

1. Install Node.js (v18+)
2. Clone this repo:
   git clone https://github.com/catalin22111/fs25-discord-bot
   cd fs25-discord-bot
3. Install dependencies:
   npm install
4. Create a `config.json` (optional, or use `.env`):
   {
     "token": "YOUR_TOKEN",
     "serverUrl": "YOUR_FS25_XML_URL",
     "channelId": "YOUR_CHANNEL_ID",
     "interval": 10
   }
5. Run:
   node index.js

---

## ☁️ Hosting on Render.com (Recommended)

1. Create a free account at https://render.com
2. Click **“New Web Service”**
3. Connect your **GitHub repo**
4. Use these settings:
   - Build Command: npm install
   - Start Command: node index.js
   - Instance Type: Free
5. Add environment variables under “Environment” (see table above)
6. Deploy 🎉

You’ll see logs like:
✅ Bot connected as RoFarm Romania#1644
📊 Stats → players=3 slots=16 name="RoFarm Romania"
✅ Renamed channel to: 🟢 Active Players - (3/16)

---

## 🕒 Keeping Render Awake 24/7

Render free instances sleep after 15 minutes of inactivity.  
To keep it alive, use **UptimeRobot**:

- Create a new monitor  
- Type: HTTP(s)  
- URL: https://your-app-name.onrender.com  
- Interval: every 5 minutes

---

## 🔍 Debugging

If something isn’t working:
- Check Render logs under “Logs”
- Verify:
  - Bot has Manage Channels permission
  - Correct CHANNEL_ID
  - XML URL loads in your browser
  - TOKEN is valid (no spaces or extra quotes)

---

## 💡 Example Result

In Discord, your channel will look like:

> 🟢 Active Players - (4/16)

---

## 🧠 Credits

Developed by **Catalin Cata**  
Enhanced & documented with assistance from ChatGPT 🧩

---

## 🧰 License

This project is licensed under the MIT License.
