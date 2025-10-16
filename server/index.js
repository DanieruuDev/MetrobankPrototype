const express = require("express");
const userAdminRouter = require("./routes/admin-user-router.js");
const path = require("path");
const disbursementRouter = require("./routes/disbursment-schedule-router.js");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
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
const tuitionInvoiceRouter = require("./routes/tuition-invoice-router.js");
require("./utils/scheduler.js");
const processProgressRouter = require("./routes/process-progress-controller.js");
require("dotenv").config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: ["https://www.mbstrongwebapp.com", "http://localhost:5173"],
    credentials: true,
  })
);

app.options("*", cors());
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://www.mbstrongwebapp.com"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);
  socket.on("register_user", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`✅ User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});
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
app.use("/api/invoice", tuitionInvoiceRouter);
app.use("/api/process", processProgressRouter);

app.use("/", async (req, res) => {
  res.send("Hello World");
});

server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
