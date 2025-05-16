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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/sample", async (req, res) => {
  try {
    const admin = await pool.query(`SELECT * FROM admin`);
    res.json(admin.rows);
  } catch (error) {
    console.error(error);
  }
});

app.use("/admin", userAdminRouter);
app.use("/api/disbursement", disbursementRouter);
app.use("/api/disbursement/overview", disbursementOverview);
app.use("/api/disbursement/tracking", disbursementTracking);
app.use("/api/maintenance", maintenance);
app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/test-masterlist", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM masterlist");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching masterlist:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
