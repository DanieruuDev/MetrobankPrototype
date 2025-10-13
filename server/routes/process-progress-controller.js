const express = require("express");

const {
  startProces,
  updateProcess,
} = require("../controllers/process-progress-controller.js");

const processProgressRouter = express.Router();

processProgressRouter.post("/start", startProces);
processProgressRouter.put("/start", updateProcess);

module.exports = processProgressRouter;
