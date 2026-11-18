const express = require("express");
const cron = require("node-cron");
const crypto = require("node:crypto");

const app = express();
const PORT = 3008;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// In-memory application data
const jobs = [];
let cache = {
  data: null,
  expiresAt: 0
};

// Middleware 1: Request ID
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

// Middleware 2: Request logger and response timer
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms ID=${req.requestId}`
    );
  });

  next();
});

// Middleware 3: Basic security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// Cache helper: 30-second TTL
function getDashboardData() {
  const now = Date.now();

  if (cache.data && now < cache.expiresAt) {
    return { ...cache.data, cacheStatus: "HIT" };
  }

  const data = {
    totalJobs: jobs.length,
    completedJobs: jobs.filter(job => job.status === "Completed").length,
    pendingJobs: jobs.filter(job => job.status === "Pending").length,
    lastUpdated: new Date().toLocaleString()
  };

  cache = {
    data,
    expiresAt: now + 30 * 1000
  };

  return { ...data, cacheStatus: "MISS" };
}

// Background job: runs every minute
cron.schedule("* * * * *", () => {
  const completed = jobs.filter(job => job.status === "Completed").length;

  console.log(
    `[BACKGROUND JOB] ${new Date().toISOString()} - Total jobs: ${jobs.length}, Completed: ${completed}`
  );

  cache = { data: null, expiresAt: 0 };
});

// Home page
app.get("/", (req, res) => {
  res.render("index", {
    jobs,
    requestId: req.requestId,
    dashboard: getDashboardData()
  });
});

// Add job
app.post("/jobs", (req, res) => {
  const title = String(req.body.title || "").trim();

  if (!title) {
    return res.status(400).send("Job title is required.");
  }

  jobs.push({
    id: crypto.randomUUID(),
    title,
    status: "Pending",
    createdAt: new Date().toLocaleString()
  });

  cache = { data: null, expiresAt: 0 };
  res.redirect("/");
});

// Complete a job
app.post("/jobs/:id/complete", (req, res) => {
  const job = jobs.find(item => item.id === req.params.id);

  if (!job) {
    return res.status(404).send("Job not found.");
  }

  job.status = "Completed";
  cache = { data: null, expiresAt: 0 };
  res.redirect("/");
});

// Cached dashboard API
app.get("/api/dashboard", (req, res) => {
  const dashboard = getDashboardData();

  res.json({
    success: true,
    requestId: req.requestId,
    ...dashboard
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Task 8 server is healthy.",
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
    requestId: req.requestId
  });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error("Application error:", err.message);

  res.status(500).json({
    success: false,
    message: "Internal server error.",
    requestId: req.requestId
  });
});

app.listen(PORT, () => {
  console.log(`Task 8 running at http://localhost:${PORT}`);
  console.log("Background job scheduled: every minute.");
});


