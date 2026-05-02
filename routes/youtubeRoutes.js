const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const youtubeController = require("../controllers/youtubeController");


router.get("/search", authMiddleware(["admin", "kid"]), youtubeController.searchYoutube);

module.exports = router;
