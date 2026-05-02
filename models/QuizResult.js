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
   QuizResult Schema
========================= */
const perQuestionSchema = new Schema(
  {
    questionIndex: { type: Number, required: true },
    selectedIndex: { type: Number, default: null },
    correctIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const quizResultSchema = new Schema(
  {
    // 🔹 Optional auto increment result ID (useful for admin reporting)
    result_id: {
      type: Number,
      unique: true,
    },

    // 🔹 Numeric IDs
    kid_id: {
      type: Number,
      required: true,
      index: true,
    },

    quiz_id: {
      type: Number,
      required: true,
      index: true,
    },

    experiment_id: {
      type: Number,
      required: true,
      index: true,
    },

    attemptNumber: {
      type: Number,
      required: true,
    },

    // Selected option index per question
    answers: {
      type: [Number],
      default: [],
    },

    totalQuestions: {
      type: Number,
      required: true,
    },

    correctCount: {
      type: Number,
      required: true,
    },

    percentage: {
      type: Number,
      required: true,
    },

    // Question-by-question feedback stored
    perQuestion: {
      type: [perQuestionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

/* =========================
   Pre-save Hook for Auto Increment (result_id)
   ✅ Correct async version (NO next)
========================= */
quizResultSchema.pre("save", async function () {
  if (!this.isNew) return;

  const counter = await Counter.findOneAndUpdate(
    { name: "result_id" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  this.result_id = counter.value;
});

/* =========================
   Export Model
========================= */
module.exports =
  mongoose.models.QuizResult || mongoose.model("QuizResult", quizResultSchema);
