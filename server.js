require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const router = require("./router");

const app = express();

// ✅ CORS (allow all for now, restrict later)
app.use(cors({
  origin: "https://miniminds-sandy.vercel.app",
  credentials: true
}));

// ✅ Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Root route (IMPORTANT FIX)
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// ✅ API routes
app.use("/api", router);

// ✅ MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI); // 🔥 CHANGED
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

connectDB();

// ✅ PORT (Railway compatible)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});