const axios = require('axios');
const { supabase } = require('../config/supabaseClient');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.ai/v1/completions';

function buildPrompt(text) {
  // Strict JSON output schema and instructions
  return `You are a strict extractor. Given the job description text, extract the following fields and return ONLY a single JSON object with these keys: description, skills, salary, experience, period.

Schema (must follow exactly):
{
  "description": string | null,        // short cleaned summary of the role (max 300 chars) or null
  "skills": [string],                // array of skill keywords, lowercase, max 25 items, or []
  "salary": {                         // salary object or null if not present
    "min": number|null,               // minimum numeric amount in smallest unit (INR -> rupees, USD -> dollars) or null
    "max": number|null,               // maximum numeric amount or null
    "currency": "INR"|"USD"|string|null, // currency code or null
    "unit": "per_annum"|"per_month"|"LPA"|null // unit normalization
  } | null,
  "experience": {                     // experience requirement normalized to months
    "min_months": integer|null,
    "max_months": integer|null
  } | null,
  "period": {                         // duration of internship/contract normalized to months
    "months": integer|null
  } | null
}

Rules (must enforce):
1) Output MUST be valid JSON and nothing else — no explanation, no markdown, no text before/after.
2) Salary must include currency (INR, USD, ₹, $ etc). Convert currency symbols to code (₹ -> INR, $ -> USD). If salary described in 'LPA' (lakhs per annum), set currency to INR and unit to 'LPA', and convert min/max to numbers in lakhs (preserve decimals). If currency unspecified, set salary to null.
3) Experience must be normalized to months. If description says '2 years', set min_months:24; '6-12 months' -> min_months:6, max_months:12. Use integers or null.
4) Period (internship/contract length) must be normalized to months (integer) if present, else null.
5) Skills should be deduped, lowercased, and be short keywords (no phrases longer than 4 words). Prefer technology/framework names.
6) If a field cannot be confidently extracted, return null for objects or null for numeric fields.

Input text:
"""
${text}
"""

Remember: return ONLY the JSON object and nothing else.`;
}

async function extractFromDescription(req, res, next) {
  try {
    if (!GROQ_API_KEY) return res.status(500).json({ status: 'error', message: 'GROQ_API_KEY is not configured on server' });

    const { text, job } = req.body || {};
    const inputText = (text || job?.description || job?.title || '').toString();
    if (!inputText || inputText.trim().length === 0) return res.status(400).json({ status: 'error', message: 'No job description provided' });

    const prompt = buildPrompt(inputText);

    // Prefer using the official groq-sdk if it's available (supports streaming API);
    // otherwise fall back to the HTTP completions endpoint via axios.
    let respText = null;
    try {
      let Groq;
      try {
        // Try to require the SDK (CommonJS). If not installed, this will throw and we fall back.
        Groq = require('groq-sdk').Groq || require('groq-sdk');
        console.log('✅ GROQ SDK successfully loaded');
      } catch (eRequire) {
        console.log('⚠️ GROQ SDK not found:', eRequire.message);
        Groq = null;
      }

      if (Groq && GROQ_API_KEY) {
        console.log('🤖 Using GROQ SDK for extraction');
        console.log('📝 Prompt length:', prompt.length, 'chars');
        console.log('🔑 API Key present:', GROQ_API_KEY ? 'Yes (first 10 chars): ' + GROQ_API_KEY.substring(0, 10) + '...' : 'No');
        
        const groq = new Groq({ apiKey: GROQ_API_KEY });

        const modelToUse = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
        console.log('🎯 Using model:', modelToUse);

        // Use the chat completions streaming interface similar to the snippet provided by the user.
        const chatCompletion = await groq.chat.completions.create({
          messages: [ { role: 'user', content: prompt } ],
          model: modelToUse,
          temperature: Number(process.env.GROQ_TEMPERATURE || 0),
          max_completion_tokens: Number(process.env.GROQ_MAX_TOKENS || 8192),
          top_p: 1,
          stream: true,
          reasoning_effort: process.env.GROQ_REASONING_EFFORT || 'medium',
          stop: null
        });

        console.log('📡 Streaming response from GROQ...');
        
        // Accumulate streamed chunks
        let accumulated = '';
        let chunkCount = 0;
        for await (const chunk of chatCompletion) {
          chunkCount++;
          const content = (chunk.choices && chunk.choices[0] && (chunk.choices[0].delta?.content || chunk.choices[0].message?.content)) || '';
          if (content) {
            accumulated += content;
            // Print first few chunks to show streaming
            if (chunkCount <= 5) {
              console.log(`📦 Chunk ${chunkCount}:`, content.substring(0, 50) + (content.length > 50 ? '...' : ''));
            }
          }
        }
        
        console.log(`✅ Received ${chunkCount} chunks from GROQ`);
        console.log('📄 Full GROQ response:');
        console.log('─────────────────────────────────────────────────────');
        console.log(accumulated);
        console.log('─────────────────────────────────────────────────────');
        
        respText = accumulated;
      } else {
        // SDK not available or API key missing; fall back to HTTP API
        console.log('⚠️ GROQ SDK not available, falling back to HTTP API');
        console.log('🔑 API Key present:', GROQ_API_KEY ? 'Yes' : 'No');
        console.log('🌐 API URL:', GROQ_API_URL);
        
        const payload = {
          model: process.env.GROQ_MODEL || 'groq-alpha',
          prompt: prompt,
          max_tokens: 800,
          temperature: 0,
        };

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        };

        console.log('📤 Sending HTTP request to GROQ...');
        const resp = await axios.post(GROQ_API_URL, payload, { headers, timeout: 30000 });
        
        console.log('📥 HTTP Response status:', resp.status);
        console.log('📄 HTTP Response data:');
        console.log('─────────────────────────────────────────────────────');
        console.log(JSON.stringify(resp.data, null, 2));
        console.log('─────────────────────────────────────────────────────');
        
        // Try to read text from known response shapes
        respText = resp?.data?.choices?.[0]?.text || resp?.data?.output || resp?.data?.result || resp?.data?.choices?.[0]?.message?.content || JSON.stringify(resp.data);
        
        console.log('📝 Extracted text from response:', respText?.substring(0, 200) + (respText?.length > 200 ? '...' : ''));
      }
    } catch (eCall) {
      // If the SDK call or HTTP call fails here, rethrow to be caught by outer catch which will attempt fallback
      console.error('❌ GROQ API call failed:', eCall.message);
      console.error('Error details:', eCall);
      throw eCall;
    }

    // Parse JSON safely
    let parsed = null;
    try {
      console.log('🔍 Attempting to parse response as JSON...');
      console.log('Raw response text (first 500 chars):', respText?.substring(0, 500));
      
      // Trim surrounding whitespace
      const j = respText.toString().trim();
      // Some providers wrap JSON in backticks or markdown, remove if present
      const cleaned = j.replace(/^```json\n?|\n?```$/g, '').trim();
      
      console.log('Cleaned JSON (first 300 chars):', cleaned.substring(0, 300));
      
      parsed = JSON.parse(cleaned);
      
      console.log('✅ Successfully parsed JSON response');
      console.log('📊 Parsed object keys:', Object.keys(parsed).join(', '));
      console.log('📊 Parsed data:');
      console.log(JSON.stringify(parsed, null, 2));
      
      // Add user-friendly formatted versions to the response
      if (parsed.experience && (parsed.experience.min_months || parsed.experience.max_months)) {
        const minY = parsed.experience.min_months ? Math.round(parsed.experience.min_months / 12) : null;
        const maxY = parsed.experience.max_months ? Math.round(parsed.experience.max_months / 12) : null;
        if (minY && maxY) {
          parsed.experience_formatted = `${minY}-${maxY} years`;
        } else if (minY) {
          parsed.experience_formatted = `${minY} years`;
        }
      }
      
      if (parsed.salary && parsed.salary.min !== null && parsed.salary.max !== null) {
        const unit = parsed.salary.unit;
        if (unit === 'LPA') {
          parsed.salary_formatted = `${parsed.salary.min}-${parsed.salary.max} LPA`;
        } else if (unit === 'per_month') {
          parsed.salary_formatted = `₹${parsed.salary.min.toLocaleString()}-₹${parsed.salary.max.toLocaleString()}/month`;
        } else {
          parsed.salary_formatted = `${parsed.salary.currency || '₹'}${parsed.salary.min.toLocaleString()}-${parsed.salary.max.toLocaleString()} ${unit || 'per annum'}`;
        }
      }
      
    } catch (e) {
      console.error('❌ Failed to parse JSON:', e.message);
      console.error('Raw text that failed to parse:', respText);
      // If parsing fails, return the raw text for debugging
      return res.status(502).json({ status: 'error', message: 'LLM returned non-JSON or unparsable output', raw: respText });
    }

    // If caller provided a job object with an id, persist extracted fields into jobs table
    try {
      const incomingJob = req.body?.job || {};
      const jobId = incomingJob?.id || incomingJob?._id || incomingJob?.external_id || null;
      if (jobId && parsed) {
        const updatePayload = {};
        // description
        if (parsed.description) updatePayload.description = parsed.description;
        // skills
        if (Array.isArray(parsed.skills) && parsed.skills.length > 0) updatePayload.skills = parsed.skills;

        // salary: convert LPA to rupees for salary_min / salary_max when possible
        if (parsed.salary && (parsed.salary.min !== undefined || parsed.salary.max !== undefined)) {
          let min = parsed.salary.min || null;
          let max = parsed.salary.max || null;
          const unit = parsed.salary.unit || null; // 'LPA'|'per_annum'|'per_month'
          const currency = parsed.salary.currency || null;

          try {
            if (unit === 'LPA' && min !== null) {
              updatePayload.salary_min = Number(min) * 100000; // lakhs to rupees
            }
            if (unit === 'LPA' && max !== null) {
              updatePayload.salary_max = Number(max) * 100000;
            }
            // If unit indicates per_month and values provided, convert to annual rupees
            if (unit === 'per_month' && min !== null) updatePayload.salary_min = Number(min) * 12;
            if (unit === 'per_month' && max !== null) updatePayload.salary_max = Number(max) * 12;
            // If currency is INR and unit is per_annum (or unspecified), assume numbers are rupees
            if ((currency === 'INR' || currency === '₹' || !unit) && min !== null && !updatePayload.salary_min) updatePayload.salary_min = Number(min);
            if ((currency === 'INR' || currency === '₹' || !unit) && max !== null && !updatePayload.salary_max) updatePayload.salary_max = Number(max);
          } catch (eConv) {
            // ignore conversion errors
          }
        }

        // experience: parsed.experience {min_months, max_months}
        if (parsed.experience) {
          try {
            const em = parsed.experience;
            if (em.min_months || em.max_months) {
              const minY = em.min_months ? Math.round(em.min_months / 12) : null;
              const maxY = em.max_months ? Math.round(em.max_months / 12) : null;
              if (minY && maxY) {
                updatePayload.experience = `${minY}-${maxY} years`;
                // Also store in a machine-readable format
                updatePayload.experience_min_months = em.min_months;
                updatePayload.experience_max_months = em.max_months;
              } else if (minY) {
                updatePayload.experience = `${minY} years`;
                updatePayload.experience_min_months = em.min_months;
                updatePayload.experience_max_months = em.min_months;
              }
            }
          } catch (eExp) {
            // ignore
          }
        }

        // Period (internship length)
        if (parsed.period && parsed.period.months) {
          updatePayload.period = String(parsed.period.months);
        }

        // Persist update if we have anything
        if (Object.keys(updatePayload).length > 0) {
          console.log('💾 Attempting to persist extracted fields for job ID:', jobId);
          console.log('💾 Update payload:', JSON.stringify(updatePayload, null, 2));
          
          try {
            const { data: updatedJob, error: updateErr } = await supabase
              .from('jobs')
              .update(updatePayload)
              .eq('id', jobId)
              .select()
              .single();

            if (updateErr) {
              console.warn('⚠️ Could not persist extracted fields to jobs table:', updateErr.message || updateErr);
            } else {
              console.log('✅ Successfully persisted extracted fields to job:', updatedJob.id);
              console.log('✅ Updated job experience:', updatedJob.experience);
              console.log('✅ Updated job salary_min:', updatedJob.salary_min);
              console.log('✅ Updated job salary_max:', updatedJob.salary_max);
              
              // Attach persisted job to response so clients can use it
              parsed._persisted = { job: updatedJob };
            }
          } catch (ePersist) {
            console.warn('⚠️ Exception while persisting extracted fields:', ePersist);
          }
        } else {
          console.log('ℹ️ No fields to persist from extraction');
        }
      }
    } catch (ePersistTop) {
      console.warn('⚠️ Persist step failed unexpectedly:', ePersistTop);
    }

    return res.json({ status: 'ok', data: parsed });
  } catch (err) {
    console.error('❌ Main extraction try-catch caught error:', err.message);
    console.error('Error type:', err.constructor.name);
    console.error('Error code:', err.code);
    console.error('Full error:', err);
    
    // Network or DNS errors should fallback to a local heuristic extractor instead of failing hard
    const isNetworkErr = err && (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || (err.cause && err.cause.code === 'ENOTFOUND'));
    if (isNetworkErr) {
      console.warn('⚠️ Network error detected, using fallback heuristic extractor');
      try {
        const { text, job } = req.body || {};
        const inputText = (text || job?.description || job?.title || '').toString();
        const fallback = localExtract(inputText);
        
        console.log('✅ Fallback extraction completed');
        console.log('📊 Fallback result:', JSON.stringify(fallback, null, 2));
        
        console.warn('GROQ API unreachable, returned fallback extraction. Error:', err.message || err);
        return res.json({ status: 'ok', data: fallback, fallback: true, note: 'Used local heuristic extractor because GROQ API was unreachable' });
      } catch (e2) {
        console.error('Fallback extractor failed:', e2);
        return res.status(500).json({ status: 'error', message: 'GROQ unreachable and fallback failed', detail: e2.message });
      }
    }

    // For other errors, propagate
    console.error('❌ Non-network error, propagating to error handler');
    next(err);
  }
}

// Local heuristic extractor used when LLM is unreachable. Returns object matching expected schema.
function localExtract(text) {
  const out = {
    description: null,
    skills: [],
    salary: null,
    experience: null,
    period: null
  };

  if (!text || typeof text !== 'string') return out;

  const clean = text.replace(/\s+/g, ' ').trim();

  // Description: first 300 chars of the first paragraph
  const firstPara = clean.split(/\n\s*\n/)[0] || clean;
  out.description = firstPara.substring(0, 300).trim();

  // Skills: look for lines like 'Skills:' or 'Mandatory Skills:' or parse common tech tokens
  const skills = new Set();
  const skillsSection = (text.match(/(?:Skills|Mandatory Skills|Required Skills|Key Skills)[:\-]\s*([^\n]+)/i) || [])[1];
  if (skillsSection) {
    skillsSection.split(/[;,|]/).map(s => s.trim()).forEach(s => {
      if (s) skills.add(s.toLowerCase());
    });
  }

  // Common tech tokens
  const COMMON = ['react', 'node', 'node.js', 'python', 'java', 'sql', 'aws', 'docker', 'kubernetes', 'terraform', 'ansible', 'git', 'jenkins', 'linux', 'azure', 'gcp', 'devops', 'ci/cd', 'spring', 'typescript', 'javascript'];
  const lower = clean.toLowerCase();
  COMMON.forEach(tok => {
    if (lower.includes(tok) && skills.size < 25) skills.add(tok);
  });

  out.skills = Array.from(skills).slice(0, 25);

  // Salary: try to find LPA or ₹ or $ patterns
  const salary = extractSalaryFromText(clean);
  out.salary = salary;

  // Experience: look for patterns like '5-8 years' or '3 years' or '6 months'
  const expMatchRange = clean.match(/(\d+)\s*-\s*(\d+)\s*(?:years|year|yrs|yr|months|month|mos|mo)\b/i);
  const expMatchSingle = clean.match(/(\d+(?:\.\d+)?)\s*(?:years|year|yrs|yr)\b/i);
  const expMatchMonths = clean.match(/(\d+)\s*(?:months|month|mos|mo)\b/i);
  if (expMatchRange) {
    const a = Number(expMatchRange[1]);
    const b = Number(expMatchRange[2]);
    const unit = /months?/i.test(expMatchRange[0]) ? 'months' : 'years';
    out.experience = {
      min_months: unit === 'months' ? Math.round(a) : Math.round(a * 12),
      max_months: unit === 'months' ? Math.round(b) : Math.round(b * 12)
    };
  } else if (expMatchSingle) {
    const years = Number(expMatchSingle[1]);
    out.experience = { min_months: Math.round(years * 12), max_months: Math.round(years * 12) };
  } else if (expMatchMonths) {
    const months = Number(expMatchMonths[1]);
    out.experience = { min_months: months, max_months: months };
  }

  // Period: internship/contract durations
  const periodMatch = clean.match(/(\d+)\s*(?:-\s*(\d+)\s*)?(?:months|month|mo|months\b|month\b)/i) || clean.match(/(\d+(?:\.\d+)?)\s*(?:year|years)\b/i);
  if (periodMatch) {
    if (periodMatch[2]) {
      // range given, take max
      out.period = { months: Number(periodMatch[2]) };
    } else {
      const num = Number(periodMatch[1]);
      if (/year/i.test(periodMatch[0])) out.period = { months: Math.round(num * 12) };
      else out.period = { months: Math.round(num) };
    }
  }

  return out;
}

function extractSalaryFromText(text) {
  // look for LPA pattern
  const lpa = text.match(/(\d+(?:\.\d+)?)\s*(?:lpa|lakh|lakhs)\b/i);
  if (lpa) {
    const num = Number(lpa[1]);
    return { min: num, max: num, currency: 'INR', unit: 'LPA' };
  }

  // ₹ or INR with numbers
  const inr = text.match(/(?:₹|inr|rs\.?)[\s]*([\d,]+(?:\.\d+)?)/i);
  if (inr) {
    const raw = inr[1].replace(/,/g, '');
    const num = Number(raw);
    return { min: num, max: num, currency: 'INR', unit: 'per_annum' };
  }

  // $ amounts
  const usd = text.match(/\$\s*([\d,]+(?:\.\d+)?)/);
  if (usd) {
    const raw = usd[1].replace(/,/g, '');
    const num = Number(raw);
    return { min: num, max: num, currency: 'USD', unit: 'per_annum' };
  }

  // ranges like 5-8 LPA
  const rangeLpa = text.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakh|lakhs)\b/i);
  if (rangeLpa) {
    const a = Number(rangeLpa[1]);
    const b = Number(rangeLpa[2]);
    return { min: a, max: b, currency: 'INR', unit: 'LPA' };
  }

  return null;
}

module.exports = { extractFromDescription };
