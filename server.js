// backend/server.js
import fs from 'fs';
import https from 'https';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import webPush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();

const allowedOrigins = [
  "http://localhost:5173",
  "https://localhost:5173",
  "https://pwa-frontend-ggh2rege7-manohar-kandulas-projects.vercel.app", // ✅ your Vercel domain
];

const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile Safari or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("❌ CORS blocked request from:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

dotenv.config();



const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error("❌ Missing VAPID keys. Please set them in your .env file.");
  process.exit(1);
}

webPush.setVapidDetails(
  "mailto:you@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

let subscriptions = [];

// 📩 Subscribe endpoint
app.post("/subscribe", (req, res) => {
  console.log("📩 Subscription request body:", req.body);

  if (!req.body || !req.body.endpoint) {
    console.error("❌ Invalid subscription payload received");
    return res.status(400).json({ error: "Invalid subscription object" });
  }

  subscriptions.push(req.body);
  console.log("✅ Subscribed:", req.body.endpoint);
  res.status(201).json({ message: "Subscription received" });
});


// 🚫 Unsubscribe endpoint
app.post("/unsubscribe", (req, res) => {
  const sub = req.body;
  subscriptions = subscriptions.filter((s) => s.endpoint !== sub.endpoint);
  console.log("❌ Unsubscribed:", sub.endpoint);
  res.status(200).json({ message: "Unsubscribed successfully" });
});

// 🚀 Send notification endpoint
app.post("/sendNotification", async (req, res) => {
  const payload = JSON.stringify({
    title: "Web Push PWA",
    body: "Hello! This is your test push notification 🚀",
  });

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(sub, payload);
      console.log("📨 Notification sent to:", sub.endpoint);
    } catch (err) {
      console.error("⚠️ Error sending notification:", err);
    }
  }
  res.status(200).json({ message: "Notifications sent" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});


