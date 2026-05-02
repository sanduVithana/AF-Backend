const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const counterSchema = new Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

const StepSchema = new mongoose.Schema(
  {
    stepNumber: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true },
    instruction: { type: String, required: true, trim: true },
    safetyNote: { type: String, default: "" },
    expectedResult: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
  },
  { _id: false }
);

const YoutubeCacheItemSchema = new mongoose.Schema(
  {
    videoId: { type: String, required: true },
    title: { type: String, required: true },
    channelTitle: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
  },
  { _id: false }
);

const TutorialSchema = new mongoose.Schema(
  {
    tutorial_id: { type: Number, unique: true, index: true },

    // Foreign key to experiment component document
    experimentRef: { type: mongoose.Schema.Types.ObjectId, ref: "Experiment", required: true, unique: true },

    // future compatibility (when experiment service becomes external)
    externalExperimentId: { type: String, default: null },

    title: { type: String, required: true, trim: true },
    safetyWarnings: { type: String, default: "" },
    expectedOutcome: { type: String, default: "" },
    scienceExplanation: { type: String, default: "" },

    materials: { type: [String], default: [] },
    steps: { type: [StepSchema], required: true },

    youtube: {
      videoId: { type: String, default: "" },
      videoUrl: { type: String, default: "" },
      searchQuery: { type: String, default: "" },
      resultsCache: { type: [YoutubeCacheItemSchema], default: [] },
    },

    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

TutorialSchema.pre("save", async function () {
  if (!this.isNew) return;

  const counter = await Counter.findOneAndUpdate(
    { name: "tutorial_id" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  this.tutorial_id = counter.value;
});

module.exports = mongoose.models.Tutorial || mongoose.model("Tutorial", TutorialSchema);
