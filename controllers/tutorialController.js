const Tutorial = require("../models/Tutorial");
const Experiment = require("../models/Experiment");
const mongoose = require("mongoose");

const { validateStepsSequential } = require("../utils/validSteps");

async function resolveExperiment(experimentIdRaw) {
  const experimentId = String(experimentIdRaw || "").trim();
  if (!experimentId) return null;

  if (mongoose.isValidObjectId(experimentId)) {
    const byObjectId = await Experiment.findById(experimentId);
    if (byObjectId) return byObjectId;
  }

  if (/^\d+$/.test(experimentId)) {
    return Experiment.findOne({ experiment_id: Number(experimentId) });
  }

  return null;
}

async function resolveTutorial(tutorialIdRaw) {
  const tutorialId = String(tutorialIdRaw || "").trim();
  if (!tutorialId) return null;

  if (mongoose.isValidObjectId(tutorialId)) {
    const byObjectId = await Tutorial.findById(tutorialId);
    if (byObjectId) return byObjectId;
  }

  if (/^\d+$/.test(tutorialId)) {
    return Tutorial.findOne({ tutorial_id: Number(tutorialId) });
  }

  return null;
}

exports.createTutorial = async (req, res) => {
  try {
    const {
      experimentId,
      title,
      safetyWarnings = "",
      expectedOutcome = "",
      scienceExplanation = "",
      materials = [],
      steps,
    } = req.body;

    if (!experimentId || !title || !steps) {
      return res.status(400).json({
        success: false,
        error: { message: "experimentId, title, steps are required" },
      });
    }

    const stepCheck = validateStepsSequential(steps);
    if (!stepCheck.valid) {
      return res.status(400).json({ success: false, error: { message: stepCheck.message } });
    }

    const experiment = await resolveExperiment(experimentId);
    if (!experiment) {
      return res.status(404).json({ success: false, error: { message: "Experiment not found" } });
    }

    const existing = await Tutorial.findOne({ experimentRef: experiment._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { message: `Experiment #${experiment.experiment_id} already has a tutorial.` },
      });
    }

    const doc = await Tutorial.create({
      experimentRef: experiment._id,
      externalExperimentId: String(experiment.experiment_id ?? ""),
      title,
      safetyWarnings,
      expectedOutcome,
      scienceExplanation,
      materials,
      steps,
      createdBy: req.user?.id || "unknown",
      youtube: { videoId: "", videoUrl: "", searchQuery: "", resultsCache: [] },
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    return res.status(500).json({ success: false, error: { message: e.message } });
  }
};

exports.updateTutorial = async (req, res) => {
  try {
    const tutorial = await resolveTutorial(req.params.id);
    if (!tutorial) return res.status(404).json({ success: false, error: { message: "Tutorial not found" } });

    const {
      experimentId,
      title,
      safetyWarnings,
      expectedOutcome,
      scienceExplanation,
      materials,
      steps,
    } = req.body;

    if (steps) {
      const stepCheck = validateStepsSequential(steps);
      if (!stepCheck.valid) {
        return res.status(400).json({ success: false, error: { message: stepCheck.message } });
      }
      tutorial.steps = steps;
    }

    if (experimentId) {
      const experiment = await resolveExperiment(experimentId);
      if (!experiment) return res.status(404).json({ success: false, error: { message: "Experiment not found" } });

      // Check if another tutorial already exists for this experiment
      const existing = await Tutorial.findOne({
        experimentRef: experiment._id,
        _id: { $ne: tutorial._id }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: { message: `Experiment #${experiment.experiment_id} already has a different tutorial.` },
        });
      }

      tutorial.experimentRef = experiment._id;
      tutorial.externalExperimentId = String(experiment.experiment_id ?? "");
    }

    if (title !== undefined) tutorial.title = title;
    if (safetyWarnings !== undefined) tutorial.safetyWarnings = safetyWarnings;
    if (expectedOutcome !== undefined) tutorial.expectedOutcome = expectedOutcome;
    if (scienceExplanation !== undefined) tutorial.scienceExplanation = scienceExplanation;
    if (materials !== undefined) tutorial.materials = materials;

    await tutorial.save();
    return res.json({ success: true, data: tutorial });
  } catch (e) {
    return res.status(500).json({ success: false, error: { message: e.message } });
  }
};

exports.deleteTutorial = async (req, res) => {
  try {
    const tutorial = await resolveTutorial(req.params.id);
    if (!tutorial) return res.status(404).json({ success: false, error: { message: "Tutorial not found" } });

    await tutorial.deleteOne();
    return res.json({ success: true, data: { deleted: true } });
  } catch (e) {
    return res.status(500).json({ success: false, error: { message: e.message } });
  }
};

exports.getTutorial = async (req, res) => {
  try {
    const tutorial = await resolveTutorial(req.params.id);
    if (!tutorial) return res.status(404).json({ success: false, error: { message: "Tutorial not found" } });

    await tutorial.populate("experimentRef");

    return res.json({ success: true, data: tutorial });
  } catch (e) {
    return res.status(500).json({ success: false, error: { message: e.message } });
  }
};

exports.getTutorialSteps = async (req, res) => {
  try {
    const tutorial = await resolveTutorial(req.params.id);
    if (!tutorial) return res.status(404).json({ success: false, error: { message: "Tutorial not found" } });

    return res.json({
      success: true,
      data: {
        tutorialId: tutorial._id,
        tutorialNo: tutorial.tutorial_id,
        title: tutorial.title,
        youtube: tutorial.youtube,
        steps: tutorial.steps,
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: { message: e.message } });
  }
};

exports.listTutorialsByExperiment = async (req, res) => {
  try {
    const experiment = await resolveExperiment(req.params.experimentId);
    if (!experiment) return res.status(404).json({ success: false, error: { message: "Experiment not found" } });

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Tutorial.find({ experimentRef: experiment._id })
        .select("tutorial_id title safetyWarnings expectedOutcome scienceExplanation youtube.videoId youtube.videoUrl experimentRef externalExperimentId steps createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Tutorial.countDocuments({ experimentRef: experiment._id }),
    ]);

    return res.json({ success: true, data: { experiment, items, page, limit, total } });
  } catch (e) {
    return res.status(500).json({ success: false, error: { message: e.message } });
  }
};

exports.selectYoutubeVideo = async (req, res) => {
  try {
    const { videoId } = req.body;
    if (!videoId) return res.status(400).json({ success: false, error: { message: "videoId is required" } });

    const tutorial = await resolveTutorial(req.params.id);
    if (!tutorial) return res.status(404).json({ success: false, error: { message: "Tutorial not found" } });

    tutorial.youtube.videoId = videoId;
    tutorial.youtube.videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    if (req.body.searchQuery !== undefined) tutorial.youtube.searchQuery = String(req.body.searchQuery || "");

    await tutorial.save();
    return res.json({ success: true, data: tutorial });
  } catch (e) {
    return res.status(500).json({ success: false, error: { message: e.message } });
  }
};
