const express = require("express");
const router = express.Router();
const experimentController = require("../controllers/experimentController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Public
router.get("/", experimentController.getExperiments);
router.get("/:id", experimentController.getExperimentById);

// Admin only
//router.post("/", experimentController.createExperiment);
router.post("/", authMiddleware(["admin"]), upload.single('image'), experimentController.createExperiment);
router.put("/:id", authMiddleware(["admin"]), upload.single('image'), experimentController.updateExperiment);
router.delete("/:id", authMiddleware(["admin"]), experimentController.deleteExperiment);

module.exports = router;
