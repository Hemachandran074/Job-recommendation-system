const { supabase } = require('../config/supabaseClient');

/**
 * POST /api/v1/auth/signup
 * Body: { email, password, full_name, mobile, ...profileFields }
 * Registers user with Supabase Auth and stores profile in `profiles` table.
 */
async function signup(req, res, next) {
  try {
    const { email, password, full_name, mobile, ...profile } = req.body;
    if (!email || !password) return res.status(400).json({ status: 'error', message: 'email and password required' });

    // sign up via supabase auth
    const {
      data: signUpData,
      error: signUpError
    } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      // Log full error for server-side debugging (do not expose secrets)
      console.error('Supabase signUp error:', signUpError);
      return res.status(400).json({ status: 'error', message: signUpError.message });
    }

    // signUpData.user may be null if confirmation email required -- handle gracefully
    const userId = signUpData?.user?.id;

    // store profile if we have user id
    if (userId) {
      const profilePayload = {
        id: userId,
        full_name: full_name || null,
        email: email,
        mobile: mobile || null,
        ...profile
      };
      await supabase.from('profiles').upsert(profilePayload);
    }

    return res.json({ status: 'ok', message: 'signup initiated', data: signUpData });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 * Returns session info from Supabase
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ status: 'error', message: 'email and password required' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ status: 'error', message: error.message });

    return res.json({ status: 'ok', message: 'login successful', data });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login };
