const CATEGORIES = ["Roads", "Lighting", "Waste", "Water", "Public safety", "Other"];
const PRIORITIES = ["low", "medium", "high"];
const STATUSES = ["open", "in_progress", "resolved"];

function validateReport(body, partial = false) {
  const errors = [];
  const result = {};
  const fields = ["title", "location", "category", "priority", "description"];
  for (const field of fields) {
    if (partial && body[field] === undefined) continue;
    const value = body[field];
    if (typeof value !== "string" || !value.trim()) {
      errors.push(`${field} is required and must be text.`);
      continue;
    }
    result[field] = value.trim();
  }
  if (result.title && result.title.length > 120) errors.push("title must be 120 characters or fewer.");
  if (result.location && result.location.length > 180) errors.push("location must be 180 characters or fewer.");
  if (result.description && result.description.length > 2000) errors.push("description must be 2000 characters or fewer.");
  if (result.category && !CATEGORIES.includes(result.category)) errors.push("category is not supported.");
  if (result.priority && !PRIORITIES.includes(result.priority)) errors.push("priority must be low, medium, or high.");
  return { errors, value: result };
}
module.exports = { validateReport, CATEGORIES, PRIORITIES, STATUSES };
