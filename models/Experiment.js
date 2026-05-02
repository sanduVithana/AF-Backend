const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/* =========================
   Counter Schema (Internal)
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
   Experiment Schema
========================= */
const experimentSchema = new Schema(
  {
    experiment_id: {
      type: Number,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    ageGroup: {
      type: String,
      required: true,
      trim: true,
    },

    tools: {
      type: [String],
      default: [],
    },

    image: {
      type: String,
      default: null,
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    duration: {
      type: String,
      default: "30 minutes",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

/* =========================
   Auto Increment Hook
========================= */
experimentSchema.pre("save", async function () {
  if (!this.isNew) return;

  const counter = await Counter.findOneAndUpdate(
    { name: "experiment_id" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  this.experiment_id = counter.value;
});

module.exports =
  mongoose.models.Experiment ||
  mongoose.model("Experiment", experimentSchema);
