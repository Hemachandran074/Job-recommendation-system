const axios = require('axios');
const { RAPIDAPI_HOST, RAPIDAPI_KEY } = require('../config/rapidApi');

/**
 * Generic RapidAPI fetcher.
 * Adjust path and response parsing depending on the specific job API you choose on RapidAPI.
 * Example usage: fetchJobs({ query: 'ai intern', page: 1 })
 */
async function fetchJobs({ query, page = 1, per_page = 20 } = {}) {
  if (!RAPIDAPI_HOST || !RAPIDAPI_KEY) throw new Error('RapidAPI config missing');

  // Default: try to call jsearch from RapidAPI if host points there
  // Many RapidAPI job providers accept query params like query, page, etc.
  const url = `https://${RAPIDAPI_HOST}/search`;

  const params = {
    query: query || '',
    page: page,
    num_pages: 1,
    // per_page not supported by all endpoints - include if relevant
  };

  const headers = {
    'X-RapidAPI-Host': RAPIDAPI_HOST,
    'X-RapidAPI-Key': RAPIDAPI_KEY
  };

  const resp = await axios.get(url, { params, headers });
  // The response shape depends on the specific RapidAPI provider; caller should adapt accordingly.
  return resp.data;
}

module.exports = { fetchJobs };
