const express = require("express");
const pool = require("./database/dbConnect.js");
const userAdminRouter = require("./routes/admin-user-router.js");
const path = require("path");
const disbursementRouter = require("./routes/disbursment-schedule-router.js");
const app = express();
const cors = require("cors");
const disbursementOverview = require("./routes/disbursement-overview-router.js");
const disbursementTracking = require("./routes/disbursement-tracking-router.js");
const maintenance = require("./routes/maintenance-router.js");
const renewalRouter = require("./routes/renewal-router.js");
const workflowRouter = require("./routes/workflow-router.js");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", userAdminRouter);
app.use("/api/disbursement", disbursementRouter);
app.use("/api/disbursement/overview", disbursementOverview);
app.use("/api/disbursement/tracking", disbursementTracking);
app.use("/api/maintenance", maintenance);
app.use("/api/renewal", renewalRouter);
app.use("/api/workflow", workflowRouter);
app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/", async (req, res) => {
  res.send("Hello World");
});

app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
