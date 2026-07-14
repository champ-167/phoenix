require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.COC_API_TOKEN;
const DEFAULT_TAG = process.env.CLAN_TAG || '';
const BASE = 'https://api.clashofclans.com/v1';

if (!TOKEN) {
  console.warn(
    '[warning] COC_API_TOKEN is not set. Copy .env.example to .env and add your token.'
  );
}

// tiny in-memory cache so a page refresh doesn't burn API calls / hit rate limits
const cache = new Map();
const CACHE_MS = 30_000;

async function cocFetch(pathname) {
  const cached = cache.get(pathname);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;

  const res = await fetch(`${BASE}${pathname}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
  });

  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`CoC API ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  const data = await res.json();
  cache.set(pathname, { data, at: Date.now() });
  return data;
}

function tagParam(req) {
  const raw = (req.query.tag || DEFAULT_TAG || '').trim();
  if (!raw) return null;
  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  return encodeURIComponent(withHash.toUpperCase());
}

function handleErr(res, err) {
  console.error(err.message, err.body || '');
  if (err.status === 403) {
    return res.status(403).json({
      error:
        'CoC API rejected the request. Usually this means the token is missing/invalid, or the server\'s current public IP is not whitelisted for this token at developer.clashofclans.com.',
    });
  }
  if (err.status === 404) {
    return res.status(404).json({ error: 'Clan tag not found. Double-check the tag.' });
  }
  return res.status(500).json({ error: 'Unexpected error reaching the CoC API.' });
}

app.get('/api/clan', async (req, res) => {
  const tag = tagParam(req);
  if (!tag) return res.status(400).json({ error: 'No clan tag provided.' });
  try {
    res.json(await cocFetch(`/clans/${tag}`));
  } catch (err) {
    handleErr(res, err);
  }
});

app.get('/api/clan/members', async (req, res) => {
  const tag = tagParam(req);
  if (!tag) return res.status(400).json({ error: 'No clan tag provided.' });
  try {
    res.json(await cocFetch(`/clans/${tag}/members`));
  } catch (err) {
    handleErr(res, err);
  }
});

app.get('/api/clan/currentwar', async (req, res) => {
  const tag = tagParam(req);
  if (!tag) return res.status(400).json({ error: 'No clan tag provided.' });
  try {
    res.json(await cocFetch(`/clans/${tag}/currentwar`));
  } catch (err) {
    // war log / current war is private on many clans -> surface that distinctly
    if (err.status === 403) {
      return res.status(403).json({ error: 'War log is private for this clan.' });
    }
    handleErr(res, err);
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Phoenix clan site running at http://localhost:${PORT}`);
});
