// server/index.js

const express = require("express");
const userAdminRouter = require("./routes/admin-user-router.js");
const path = require("path");
const disbursementRouter = require("./routes/disbursment-schedule-router.js");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const disbursementOverview = require("./routes/disbursement-overview-router.js");
const disbursementTracking = require("./routes/disbursement-tracking-router.js");
const maintenance = require("./routes/maintenance-router.js");
const renewalRouter = require("./routes/renewal-router.js");
const workflowRouter = require("./routes/workflow-router.js");
const notificationRouter = require("./routes/notification-router.js");
const approvalRouter = require("./routes/approval-routes.js");
require("./utils/scheduler.js");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Routers
app.use("/api/auth", userAdminRouter);
app.use("/api/disbursement", disbursementRouter);
app.use("/api/disbursement/overview", disbursementOverview);
app.use("/api/disbursement/tracking", disbursementTracking);
app.use("/api/maintenance", maintenance);
app.use("/api/renewal", renewalRouter);
app.use("/api/workflow", workflowRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/approvals", approvalRouter);

// Static
app.use("/public", express.static(path.join(__dirname, "public")));

// Default route
app.use("/", (req, res) => {
  res.send("Hello World from Vercel Serverless!");
});

// ❌ Remove app.listen()
// ✅ Export app for Vercel
module.exports = app;
