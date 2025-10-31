/**
 * Simple recommendation helpers.
 * - buildQueryFromSkills: join top skills into a search query
 * - matchBySkills: filter job objects with skill overlap
 */

function buildQueryFromSkills(skills = [], maxTerms = 5) {
  if (!Array.isArray(skills)) return '';
  return skills.slice(0, maxTerms).join(' ');
}

function matchBySkills(job, userSkills = []) {
  // job.skills may be an array or a string - normalize
  const jobSkills = Array.isArray(job.skills) ? job.skills.map(s => String(s).toLowerCase()) : [];
  const user = (userSkills || []).map(s => String(s).toLowerCase());
  const overlap = jobSkills.filter(s => user.includes(s));
  return overlap.length > 0;
}

module.exports = { buildQueryFromSkills, matchBySkills };
