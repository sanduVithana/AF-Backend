const Experiment = require("../models/Experiment");

// CREATE (Admin Only)
exports.createExperiment = async (req, res) => {
  try {
    const experimentData = { ...req.body };
    if (req.file) {
      experimentData.image = req.file.path;
    }
    if (experimentData.tools) {
      experimentData.tools = JSON.parse(experimentData.tools);
    }
    const experiment = new Experiment(experimentData);
    const savedExperiment = await experiment.save();
    res.status(201).json(savedExperiment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// READ ALL
exports.getExperiments = async (req, res) => {
  try {
    const { ageGroup } = req.query;

    let filter = {};
    if (ageGroup) filter.ageGroup = ageGroup;

    const experiments = await Experiment.find(filter);
    res.json(experiments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// READ ONE
exports.getExperimentById = async (req, res) => {
  try {
    const experiment = await Experiment.findOne({
      experiment_id: req.params.id
    });

    if (!experiment)
      return res.status(404).json({ message: "Experiment not found" });

    res.json(experiment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE
exports.updateExperiment = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = req.file.path;
    }
    if (updateData.tools) {
      updateData.tools = JSON.parse(updateData.tools);
    }
    const updated = await Experiment.findOneAndUpdate(
      { experiment_id: req.params.id },
      updateData,
      { returnDocument: "after" }
    );

    if (!updated)
      return res.status(404).json({ message: "Experiment not found" });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE
exports.deleteExperiment = async (req, res) => {
  try {
    const deleted = await Experiment.findOneAndDelete({
      experiment_id: req.params.id
    });

    if (!deleted)
      return res.status(404).json({ message: "Experiment not found" });

    res.json({ message: "Experiment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
