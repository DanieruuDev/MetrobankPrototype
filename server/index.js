// server/index.js

const express = require("express");
const userAdminRouter = require("./routes/admin-user-router.js");
const path = require("path");
const disbursementRouter = require("./routes/disbursment-schedule-router.js");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const disbursementOverview = require("./routes/disbursement-overview-router.js");
const disbursementTracking = require("./routes/disbursement-tracking-router.js");
const maintenance = require("./routes/maintenance-router.js");
const renewalRouter = require("./routes/renewal-router.js");
const workflowRouter = require("./routes/workflow-router.js");
const notificationRouter = require("./routes/notification-router.js");
const approvalRouter = require("./routes/approval-routes.js");
const documentRouter = require("./routes/document-router");
const uploadStatusRouter = require("./routes/upload-status.js");

require("./utils/scheduler.js");
require("dotenv").config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: ["https://metrobank-prototype.vercel.app", "http://localhost:5173"],
    credentials: true,
  })
);

const PORT = process.env.PORT || 5000;

app.use("/api/auth", userAdminRouter);
app.use("/api/document", documentRouter);
app.use("/api/disbursement", disbursementRouter);
app.use("/api/disbursement/overview", disbursementOverview);
app.use("/api/disbursement/tracking", disbursementTracking);
app.use("/api/maintenance", maintenance);
app.use("/api/renewal", renewalRouter);
app.use("/api/workflow", workflowRouter);
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/api/notification", notificationRouter);
app.use("/api/approvals", approvalRouter);
app.use("/api/jobs", uploadStatusRouter);

app.use("/", async (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
