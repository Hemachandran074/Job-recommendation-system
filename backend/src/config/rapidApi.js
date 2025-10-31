// Basic RapidAPI config wrapper
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

if (!RAPIDAPI_HOST || !RAPIDAPI_KEY) {
  console.warn('RAPIDAPI_HOST or RAPIDAPI_KEY not set. RapidAPI calls will fail until provided.');
}

module.exports = { RAPIDAPI_HOST, RAPIDAPI_KEY };
