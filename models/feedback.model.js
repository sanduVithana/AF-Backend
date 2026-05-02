const mongoose = require("mongoose");

const Counter =
  mongoose.models.Counter ||
  mongoose.model("Counter", new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    value: { type: Number, default: 0 },
  }));

const feedbackSchema = new mongoose.Schema(
  {
    feedback_id: {
      type: Number,
      unique: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    experiment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Experiment",
      required: true,
    },
    feedbackType: {
      type: String,
      enum: ["positive", "negative", "knowledge-sharing"],
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ student: 1, experiment: 1 }, { unique: true });

feedbackSchema.pre("save", async function () {
  if (!this.isNew) return;

  const counter = await Counter.findOneAndUpdate(
    { name: "feedback_id" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  this.feedback_id = counter.value;
});

module.exports = mongoose.model("Feedback", feedbackSchema);
