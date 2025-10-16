const express = require("express");

const {
  updateRenewalProcess,
  getProcess,
} = require("../controllers/process-progress-controller.js");

const processProgressRouter = express.Router();

processProgressRouter.put("/update-renewal", updateRenewalProcess);

processProgressRouter.get("/:sy_code/:semester_code", getProcess);

module.exports = processProgressRouter;
