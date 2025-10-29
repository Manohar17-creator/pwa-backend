import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import webPush from "web-push";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(bodyParser.json());

// ✅ CORS config
const allowedOrigins = [
  "http://localhost:5173",
  "https://localhost:5173",
  "https://pwa-frontend-ggh2rege7-manohar-kandulas-projects.vercel.app",
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

// ✅ VAPID setup
webPush.setVapidDetails(
  "mailto:test@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const subscriptions = [];

// ✅ Routes
app.get("/", (req, res) => {
  res.status(200).send("✅ Web Push Backend running successfully!");
});

app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription object" });
  }
  subscriptions.push(subscription);
  console.log("✅ Subscribed:", subscription.endpoint);
  res.status(201).json({ message: "Subscription received" });
});

app.post("/sendNotification", async (req, res) => {
  const payload = JSON.stringify({ title: "Push Test", body: "Hello from server!" });
  try {
    const notifyAll = subscriptions.map(sub =>
      webPush.sendNotification(sub, payload)
    );
    await Promise.all(notifyAll);
    console.log("📨 Notification sent to all subscribers");
    res.status(200).json({ message: "Notification sent" });
  } catch (err) {
    console.error("❌ Error sending notification:", err);
    res.status(500).json({ error: "Notification failed" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
