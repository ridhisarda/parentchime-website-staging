const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanString(value, maxLength) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().replace(/\s+/g, ' ');
  if (!cleaned) return null;
  return cleaned.slice(0, maxLength);
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return json(res, 500, { error: 'Waitlist is not configured yet.' });
  }

  let body = typeof req.body === 'object' && req.body !== null ? req.body : {};
  if (typeof req.body === 'string') {
    try {
      body = JSON.parse(req.body);
    } catch {
      return json(res, 400, { error: 'Invalid request body.' });
    }
  }
  const email = cleanString(body.email, 254)?.toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return json(res, 400, { error: 'Please enter a valid email address.' });
  }

  const payload = {
    email,
    email_normalized: email,
    first_name: cleanString(body.first_name, 80),
    city: cleanString(body.city, 120),
    country: cleanString(body.country, 120),
    source: cleanString(body.source, 80) || 'website',
  };

  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/waitlist_signups?on_conflict=email_normalized`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('waitlist insert failed', response.status, detail);
    return json(res, 500, { error: 'Could not join the waitlist. Please try again.' });
  }

  return json(res, 200, { ok: true });
};
