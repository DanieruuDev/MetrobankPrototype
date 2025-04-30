const express = require("express");
const pool = require("./database/dbConnect.js");
const userAdminRouter = require("./routes/admin-user-router.js");
const path = require("path");
const disbursementRouter = require("./routes/disbursment-schedule.js");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

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
app.use("/public", express.static(path.join(__dirname, "public")));

app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
