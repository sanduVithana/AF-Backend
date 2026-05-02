const mongoose = require("mongoose");
const Tutorial = require("../models/Tutorial");

exports.searchYoutube = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const max = Math.min(Math.max(parseInt(req.query.max || "5", 10), 1), 10);
    const tutorialId = req.query.tutorialId ? String(req.query.tutorialId).trim() : "";

    if (!q) return res.status(400).json({ success: false, error: { message: "q query param is required" } });
    if (tutorialId && !mongoose.isValidObjectId(tutorialId)) {
      return res.status(400).json({ success: false, error: { message: "Invalid tutorialId" } });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return res.status(500).json({ success: false, error: { message: "YOUTUBE_API_KEY missing in env" } });

    const params = new URLSearchParams({
      key: apiKey,
      part: "snippet",
      q,
      maxResults: String(max),
      type: "video",
      safeSearch: "strict",
    });

    const ytResp = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!ytResp.ok) {
      const body = await ytResp.text();
      return res.status(502).json({
        success: false,
        error: { message: "YouTube request failed", details: { status: ytResp.status, msg: body } },
      });
    }

    const resp = await ytResp.json();

    const items = (resp.items || [])
      .map((it) => ({
        videoId: it.id?.videoId,
        title: it.snippet?.title,
        channelTitle: it.snippet?.channelTitle,
        thumbnailUrl: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url || "",
      }))
      .filter((x) => x.videoId);

    if (tutorialId) {
      const tutorial = await Tutorial.findById(tutorialId);
      if (!tutorial) {
        return res.status(404).json({ success: false, error: { message: "Tutorial not found" } });
      }

      tutorial.youtube.searchQuery = q;
      tutorial.youtube.resultsCache = items;
      await tutorial.save();
    }

    return res.json({ success: true, data: { query: q, items } });
  } catch (e) {
    const msg = e.message || "YouTube API error";
    return res.status(502).json({ success: false, error: { message: "YouTube request failed", details: { msg } } });
  }
};
