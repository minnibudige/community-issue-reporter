require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const reportsRouter = require("./routes/reports");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false })); // CSP is disabled for beginner-friendly local setup; enable and tune before public deployment.
app.use(express.json({ limit: "30kb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false }));

if (process.env.CORS_ORIGIN) {
  const origins = process.env.CORS_ORIGIN.split(",").map(s => s.trim()).filter(Boolean);
  app.use(cors({ origin: origins }));
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "community-issue-reporter", databaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) });
});
app.use("/api/reports", reportsRouter);
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.get("*path", (req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API endpoint not found." });
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"), error => { if (error) next(error); });
});

app.use((err, req, res, next) => {
  // Keep provider error details in server logs only.
  console.error("Request failed:", err.message || err);
  if (res.headersSent) return next(err);
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.status(status).json({ error: status === 500 ? "Something went wrong on the server. Check the backend terminal for details." : "Request could not be completed." });
});

app.listen(port, () => console.log(`Community Issue Reporter running at http://localhost:${port}`));
