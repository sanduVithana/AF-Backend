const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/* =========================
   Counter Schema (Auto Increment)
========================= */
const counterSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: Number,
    default: 0,
  },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

/* =========================
   User Schema
========================= */
const userSchema = new Schema(
  {
    // 🔹 Auto Increment User ID
    user_id: {
      type: Number,
      unique: true,
    },

    role: {
      type: String,
      enum: ["admin", "kid"],
      default: "kid",
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // Kid profile fields
    name: {
      type: String,
      trim: true,
      default: "",
    },

    age: {
      type: Number,
      min: 3,
      max: 18,
      default: null,
    },

    grade: {
      type: String,
      trim: true,
      default: "",
    },

    profilePic: {
      type: String,
      default: "",
    },

    quizStats: {
      attempts: { type: Number, default: 0 },
      totalCorrect: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 0 },
      totalPercentSum: { type: Number, default: 0 }, // sum of attempt percentages
      avgPercent: { type: Number, default: 0 },      // computed average
      lastPercent: { type: Number, default: 0 }      // last attempt percentage
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/* =========================
   Pre-save Hook for Auto Increment
   ✅ Correct async version (NO next)
========================= */
userSchema.pre("save", async function () {
  if (!this.isNew) return;

  const counter = await Counter.findOneAndUpdate(
    { name: "user_id" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  this.user_id = counter.value;
});

/* =========================
   Export Model
========================= */
module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);

