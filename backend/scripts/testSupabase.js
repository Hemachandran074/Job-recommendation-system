// Simple script to test Supabase connectivity using backend .env
require('dotenv').config({ path: __dirname + '/../.env' });
const { supabase } = require('../src/config/supabaseClient');

(async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    console.log('ERROR:', error);
    console.log('DATA:', data);
  } catch (e) {
    console.error('EXCEPTION:', e.message || e);
  }
})();
