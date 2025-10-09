const express = require("express");
const { getJob } = require("../services/jobTracker");

const uploadStatusRouter = express.Router();

uploadStatusRouter.get("/:jobId", async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

module.exports = uploadStatusRouter;
