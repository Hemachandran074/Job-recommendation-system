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

/**
 * PATCH /api/v1/users/:id
 * Updates the user's profile fields (creates profile if doesn't exist)
 * Handles partial updates and ensures no data conflicts
 */
async function updateUserProfile(req, res, next) {
  try {
    const { id } = req.params;
    const payload = req.body;
    if (!id) return res.status(400).json({ status: 'error', message: 'user id required' });

    console.log(`📝 Updating profile for user ${id}:`, payload);

    // Check if profile exists first
    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error fetching existing profile:', fetchError);
      return res.status(400).json({ status: 'error', message: fetchError.message });
    }

    let data, error;
    if (existing) {
      // Profile exists - do UPDATE with only changed fields
      console.log('✅ Profile exists, performing UPDATE');
      
      // Filter out undefined values to avoid overwriting with null
      const updatePayload = {};
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) {
          updatePayload[key] = value;
        }
      }
      
      const result = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      data = result.data;
      error = result.error;
      
      if (data) {
        console.log('✅ Profile updated successfully');
      }
    } else {
      // Profile doesn't exist - do INSERT with id
      console.log('⚠️ Profile does not exist, creating new profile');
      const profilePayload = { id, ...payload };
      const result = await supabase
        .from('profiles')
        .insert(profilePayload)
        .select()
        .maybeSingle();
      
      data = result.data;
      error = result.error;
      
      if (data) {
        console.log('✅ New profile created successfully');
      }
    }

    if (error) {
      console.error('❌ Profile update/insert error:', error);
      return res.status(400).json({ status: 'error', message: error.message, detail: error });
    }

    return res.json({ status: 'ok', data, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('❌ Unexpected error in updateUserProfile:', err);
    next(err);
  }
}

module.exports = { getUserProfile, updateUserProfile };
