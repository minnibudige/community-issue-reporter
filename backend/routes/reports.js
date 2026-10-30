const express = require("express");
const { supabase } = require("../supabase");
const { validateReport, STATUSES } = require("../utils/validation");
const router = express.Router();

function ensureDatabase(req, res, next) {
  if (!supabase) return res.status(503).json({ error: "Database is not configured. Set the Supabase variables in backend/.env and restart the server." });
  next();
}
router.use(ensureDatabase);

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    const reports = data || [];
    res.json({ reports, stats: { total: reports.length, open: reports.filter(r => r.status !== "resolved").length, resolved: reports.filter(r => r.status === "resolved").length } });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  const { errors, value } = validateReport(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });
  try {
    const { data, error } = await supabase.from("reports").insert(value).select("*").single();
    if (error) throw error;
    res.status(201).json({ report: data });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("reports").select("*").eq("id", req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Report not found." });
    res.json({ report: data });
  } catch (error) { next(error); }
});

router.put("/:id", async (req, res, next) => {
  const { errors, value } = validateReport(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });
  try {
    const { data, error } = await supabase.from("reports").update(value).eq("id", req.params.id).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Report not found." });
    res.json({ report: data });
  } catch (error) { next(error); }
});

router.patch("/:id", async (req, res, next) => {
  const allowed = Object.keys(req.body || {});
  if (allowed.length !== 1 || allowed[0] !== "status" || !STATUSES.includes(req.body.status)) {
    return res.status(400).json({ error: "Send only a valid status: open, in_progress, or resolved." });
  }
  try {
    const { data, error } = await supabase.from("reports").update({ status: req.body.status }).eq("id", req.params.id).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Report not found." });
    res.json({ report: data });
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("reports").delete().eq("id", req.params.id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Report not found." });
    res.json({ message: "Report deleted successfully.", id: data.id });
  } catch (error) { next(error); }
});
module.exports = router;
