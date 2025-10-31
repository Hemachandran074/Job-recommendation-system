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
    // include user metadata (full_name, mobile) so user object contains name
    const signUpOpts = { data: {} };
    if (full_name) signUpOpts.data.full_name = full_name;
    if (mobile) signUpOpts.data.mobile = mobile;

    const {
      data: signUpData,
      error: signUpError
    } = await supabase.auth.signUp({ email, password }, signUpOpts);

    if (signUpError) {
      // Log full error for server-side debugging (do not expose secrets)
      console.error('Supabase signUp error:', signUpError);
      return res.status(400).json({ status: 'error', message: signUpError.message });
    }

  // signUpData.user may be present even if session is not (email confirm required)
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

    // Normalize response for frontend convenience
    const access_token = signUpData?.session?.access_token || null;
    const token_type = signUpData?.session?.token_type || null;
    const user = signUpData?.user ? {
      id: signUpData.user.id,
      email: signUpData.user.email,
      name: signUpData.user.user_metadata?.full_name || full_name || null
    } : null;

    // Indicate whether email confirmation is required (no session but user exists)
    const email_confirmation_required = !!(signUpData?.user && !signUpData?.session);

    return res.json({ access_token, token_type, user, email_confirmation_required, message: 'signup initiated' });
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

    // Normalize response
    const access_token = data?.session?.access_token || null;
    const token_type = data?.session?.token_type || null;
    const user = data?.user ? {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null
    } : null;

    // If session is missing, likely email confirmation required
    if (!data?.session) {
      return res.status(401).json({
        access_token: null,
        token_type: null,
        user: user,
        email_confirmation_required: !!data?.user,
        message: 'No session created. Please confirm your email before logging in.'
      });
    }

    return res.json({ access_token, token_type, user, message: 'login successful' });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login };
