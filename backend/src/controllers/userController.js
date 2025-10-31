const { supabase } = require('../config/supabaseClient');

/**
 * GET /api/v1/users/:id
 * Returns the user's profile from profiles table
 */
async function getUserProfile(req, res, next) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error) return res.status(400).json({ status: 'error', message: error.message });
    if (!data) return res.status(404).json({ status: 'error', message: 'profile not found' });
    return res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUserProfile };
