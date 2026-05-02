// const mongoose = require("mongoose");

// const questionSchema = new mongoose.Schema(
//   {
//     questionText: { type: String, required: true, trim: true },
//     options: {
//       type: [String],
//       required: true,
//       validate: {
//         validator: (arr) => Array.isArray(arr) && arr.length >= 2,
//         message: "Each question must have at least 2 options"
//       }
//     },
//     correctIndex: {
//       type: Number,
//       required: true,
//       min: 0
//     },
//     explanation: { type: String, default: "" }
//   },
//   { _id: false }
// );

// const quizSchema = new mongoose.Schema(
//   {
//     experimentId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Experiment",
//       required: true,
//       index: true
//     },
//     title: { type: String, default: "" },
//     isActive: { type: Boolean, default: true },
//     questions: { type: [questionSchema], required: true },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null
//     }
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Quiz", quizSchema);


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
   Quiz Schema
========================= */
const questionSchema = new Schema(
  {
    questionText: { type: String, required: true, trim: true },

    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2,
        message: "Each question must have at least 2 options",
      },
    },

    correctIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    explanation: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const quizSchema = new Schema(
  {
    // 🔹 Auto Increment Quiz ID
    quiz_id: {
      type: Number,
      unique: true,
    },

    // 🔹 Numeric experiment id (your Experiment model uses experiment_id)
    experiment_id: {
      type: Number,
      required: true,
      index: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    questions: {
      type: [questionSchema],
      required: true,
    },

    // 🔹 store admin numeric id (optional)
    createdBy_user_id: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

/* =========================
   Pre-save Hook for Auto Increment
   ✅ Correct async version (NO next)
========================= */
quizSchema.pre("save", async function () {
  if (!this.isNew) return;

  const counter = await Counter.findOneAndUpdate(
    { name: "quiz_id" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  this.quiz_id = counter.value;
});

/* =========================
   Export Model
========================= */
module.exports =
  mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);
