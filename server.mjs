// ============================================================
// VoyaIQ — Express API Server (Pure JS / Cloud Run)
// Serves the React SPA + proxies Gemini AI securely
// ============================================================

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const geminiClient = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_CONTEXT_LENGTH = 12000;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

app.use(express.json({ limit: '4mb' }));

// ── Security Headers ─────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const SYSTEM_PROMPT = `You are VoyaIQ, an expert AI travel planning assistant.
You help users discover destinations, build multi-day itineraries, and plan smart trips.
Always consider budget, dietary needs, mobility constraints, and travel style.
Keep responses concise, structured, and actionable. Use markdown formatting.
When suggesting activities, include estimated costs in INR and duration in minutes.`;

function sanitizeText(value, maxLength = MAX_MESSAGE_LENGTH) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, maxLength);
}

function sanitizeMessages(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((message) => ({
      role: message?.role === 'user' ? 'user' : 'model',
      content: sanitizeText(message?.content),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-24);
}

function sanitizeImageBase64(value) {
  if (typeof value !== 'string') return null;
  const compact = value.replace(/\s+/g, '').trim();
  if (!compact) return null;
  if (!/^[A-Za-z0-9+/=]+$/.test(compact)) return null;
  const estimatedBytes = Math.floor((compact.length * 3) / 4);
  return estimatedBytes <= MAX_IMAGE_BYTES ? compact : null;
}

function parseModelJson(text) {
  const cleaned = sanitizeText(text, 200000)
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const objStart = cleaned.indexOf('{');
    const arrStart = cleaned.indexOf('[');
    const startCandidates = [objStart, arrStart].filter((x) => x >= 0);
    if (startCandidates.length === 0) throw new Error('No JSON payload found');
    const start = Math.min(...startCandidates);
    const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
    if (end < start) throw new Error('Malformed JSON payload');
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

async function generateJson(prompt) {
  if (!geminiClient) throw new Error('Gemini client unavailable');
  const model = geminiClient.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await model.generateContent(prompt);
  return parseModelJson(result.response.text());
}

// ── POST /api/chat — Streaming Gemini Chat ───────────────────
app.post('/api/chat', async (req, res) => {
  const { messages, itineraryContext, imageBase64 } = req.body;
  if (!geminiClient) { res.status(503).json({ error: 'AI service not configured' }); return; }

  const safeMessages = sanitizeMessages(messages);
  if (safeMessages.length === 0) {
    res.status(400).json({ error: 'messages array required' }); return;
  }
  const safeContext = sanitizeText(itineraryContext, MAX_CONTEXT_LENGTH);
  const safeImage = sanitizeImageBase64(imageBase64);

  try {
    const model = geminiClient.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_PROMPT + (safeContext ? `\n\nCurrent itinerary:\n${safeContext}` : ''),
    });

    const history = safeMessages.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const lastMsg = safeMessages[safeMessages.length - 1];
    const parts = [];
    if (safeImage) parts.push({ inlineData: { mimeType: 'image/jpeg', data: safeImage } });
    parts.push({ text: lastMsg.content });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');

    const result = await chat.sendMessageStream(parts);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) res.write(text);
    }
    res.end();
  } catch (err) {
    console.error('Chat error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'AI temporarily unavailable' });
  }
});

// ── POST /api/discover — AI Destination Discovery ────────────
app.post('/api/discover', async (req, res) => {
  const { query, userLat, userLng, preferences } = req.body;
  const safeQuery = sanitizeText(query, 300);
  if (!safeQuery) { res.status(400).json({ error: 'query required' }); return; }
  if (!geminiClient) { res.status(503).json({ error: 'AI service not configured' }); return; }
  const hasLocation = Number.isFinite(Number(userLat)) && Number.isFinite(Number(userLng));

  const locationHint = hasLocation
    ? `User is currently near ${Number(userLat).toFixed(1)}°N, ${Number(userLng).toFixed(1)}°E. Prioritize reachable Indian destinations.`
    : 'Show diverse Indian destinations.';

  const prompt = `${SYSTEM_PROMPT}

${locationHint}
User preferences: ${JSON.stringify(preferences ?? {})}
Query: "${safeQuery}"

Return a JSON array of exactly 5 travel destinations. Each object must have:
{
  "id": "unique-slug",
  "name": "Name",
  "country": "India",
  "description": "2-3 vivid sentences",
  "heroImageUrl": "https://images.unsplash.com/photo-XXXXXX?w=800&q=80",
  "location": { "lat": 0.0, "lng": 0.0 },
  "rating": 4.5,
  "priceLevel": 2,
  "tags": ["Tag1", "Tag2", "Tag3"],
  "matchScore": 85,
  "matchReasons": ["Reason matching the query"],
  "climate": { "tempMin": 22, "tempMax": 32, "rainProbability": 15, "condition": "sunny", "description": "Warm & sunny" },
  "bestFor": ["Solo", "Couples"]
}

heroImageUrl must use real Unsplash photo IDs relevant to that place.
Return ONLY the raw JSON array. No markdown fences.`;

  try {
    const destinations = await generateJson(prompt);
    if (!Array.isArray(destinations)) throw new Error('Expected destination list');
    res.json({ destinations });
  } catch (err) {
    console.error('Discover error:', err);
    res.status(500).json({ error: 'Discovery service temporarily unavailable' });
  }
});

// ── POST /api/autofill — AI Activity Auto-fill ───────────────
app.post('/api/autofill', async (req, res) => {
  const { destination, slot, dayNumber, preferences, existingActivities } = req.body;
  const safeDestination = sanitizeText(destination, 120);
  const safeSlot = typeof slot === 'string' ? slot : '';
  if (!safeDestination || !safeSlot) { res.status(400).json({ error: 'destination and slot required' }); return; }
  if (!geminiClient) { res.status(503).json({ error: 'AI service not configured' }); return; }

  const slotTimes = { morning: '6:00 AM – 12:00 PM', afternoon: '12:00 PM – 6:00 PM', evening: '6:00 PM – 11:00 PM' };
  if (!slotTimes[safeSlot]) { res.status(400).json({ error: 'invalid slot' }); return; }
  const existing = Array.isArray(existingActivities)
    ? existingActivities.map((activity) => sanitizeText(activity, 120)).filter(Boolean).join(', ')
    : 'nothing yet';

  const prompt = `${SYSTEM_PROMPT}

Generate 1 activity for Day ${Math.max(1, Number(dayNumber) || 1)} of a trip to ${safeDestination}.
Time: ${safeSlot} (${slotTimes[safeSlot]})
User preferences: ${JSON.stringify(preferences ?? {})}
Already planned today: ${existing}
Do NOT suggest anything already planned.

Return a single JSON object:
{
  "name": "Activity Name",
  "category": "restaurant|attraction|nature|experience|wellness|shopping",
  "description": "2 engaging sentences",
  "address": "Real street address in ${safeDestination}",
  "location": { "lat": 0.0, "lng": 0.0 },
  "duration": 90,
  "estimatedCost": 500,
  "tags": ["Tag1", "Tag2"],
  "isWheelchairAccessible": false,
  "rating": 4.3
}

Return ONLY the raw JSON object. No markdown fences.`;

  try {
    const activity = await generateJson(prompt);
    res.json({ activity });
  } catch (err) {
    console.error('Autofill error:', err);
    res.status(500).json({ error: 'Auto-fill temporarily unavailable' });
  }
});

// ── POST /api/itinerary-generate — Full AI Trip Builder ──────
app.post('/api/itinerary-generate', async (req, res) => {
  const { destination, days, preferences, budget } = req.body;
  const safeDestination = sanitizeText(destination, 120);
  const safeDays = Math.min(21, Math.max(1, Number(days) || 0));
  const safeBudget = Math.max(1, Number(budget) || 40000);
  if (!safeDestination || !safeDays) { res.status(400).json({ error: 'destination and days required' }); return; }
  if (!geminiClient) { res.status(503).json({ error: 'AI service not configured' }); return; }

  const prompt = `${SYSTEM_PROMPT}

Build a complete ${safeDays}-day itinerary for ${safeDestination}.
Total budget: INR ${safeBudget}
User preferences: ${JSON.stringify(preferences ?? {})}

Return a JSON array of ${safeDays} day objects:
[{
  "dayNumber": 1,
  "morning": [{
    "name": "",
    "category": "attraction|restaurant|nature|experience|wellness|shopping",
    "description": "",
    "address": "",
    "location": { "lat": 0, "lng": 0 },
    "duration": 90,
    "estimatedCost": 500,
    "tags": [],
    "rating": 4.2
  }],
  "afternoon": [],
  "evening": []
}]

1-2 activities per slot. Spread budget across all days.
Return ONLY the raw JSON array. No markdown fences.`;

  try {
    const itinerary = await generateJson(prompt);
    if (!Array.isArray(itinerary)) throw new Error('Expected itinerary list');
    res.json({ itinerary });
  } catch (err) {
    console.error('Itinerary generate error:', err);
    res.status(500).json({ error: 'Itinerary generation temporarily unavailable' });
  }
});

// ── POST /api/packing-generate — AI Packing List ───────────────
app.post('/api/packing-generate', async (req, res) => {
  const { destination, days, tripType, weather } = req.body;
  const safeDestination = sanitizeText(destination, 120);
  const safeDays = Math.min(30, Math.max(1, Number(days) || 5));
  if (!safeDestination) { res.status(400).json({ error: 'destination required' }); return; }
  if (!geminiClient) { res.status(503).json({ error: 'AI service not configured' }); return; }

  const prompt = `${SYSTEM_PROMPT}

Generate a comprehensive packing list for a ${safeDays}-day trip to ${safeDestination}.
Trip Type: ${sanitizeText(tripType, 80) || 'General'}
Weather/Climate: ${sanitizeText(weather, 80) || 'Unknown'}

Return ONLY a JSON array of category objects matching this exact structure:
[
  {
    "name": "Clothing",
    "icon": "👕",
    "items": [
      { "id": "uuid-1", "name": "Item name", "category": "Clothing", "checked": false, "isCustom": false }
    ]
  }
]
Use appropriate emojis for icons. Keep it concise but cover essentials. No markdown fences.`;

  try {
    const categories = await generateJson(prompt);
    if (!Array.isArray(categories)) throw new Error('Expected packing categories');
    res.json({ categories });
  } catch (err) {
    console.error('Packing generate error:', err);
    res.status(500).json({ error: 'Packing generation temporarily unavailable' });
  }
});

// ── POST /api/budget-optimize — AI Budget Suggestions ──────────
app.post('/api/budget-optimize', async (req, res) => {
  const { destination, breakdown, total } = req.body;
  const safeTotal = Number(total);
  if (!breakdown || !Number.isFinite(safeTotal) || safeTotal <= 0) {
    res.status(400).json({ error: 'breakdown and total required' }); return;
  }
  if (!geminiClient) { res.status(503).json({ error: 'AI service not configured' }); return; }

  const prompt = `${SYSTEM_PROMPT}

Analyze this budget for a trip to ${sanitizeText(destination, 120) || 'Unknown'}:
Total Budget: INR ${Math.round(safeTotal)}
Breakdown: ${JSON.stringify(breakdown)}

Suggest 3 clever, specific ways to save money without ruining the experience.
Return ONLY a JSON array matching this structure:
[
  {
    "title": "Short actionable title",
    "savings": 1500,
    "impact": "low",
    "desc": "1-sentence explanation of how to save this."
  }
]
Impact must be "low", "medium", or "high".
Return ONLY the raw JSON array. No markdown fences.`;

  try {
    const suggestions = await generateJson(prompt);
    if (!Array.isArray(suggestions)) throw new Error('Expected optimization suggestions');
    res.json({ suggestions });
  } catch (err) {
    console.error('Budget optimize error:', err);
    res.status(500).json({ error: 'Budget optimization temporarily unavailable' });
  }
});

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    gemini: GEMINI_API_KEY ? 'configured' : 'missing',
    timestamp: new Date().toISOString(),
  });
});

// ── Static files & SPA fallback ─────────────────────────────
const DIST = path.join(__dirname, 'dist');
app.use('/assets', express.static(path.join(DIST, 'assets'), { maxAge: '1y', immutable: true }));
app.use(express.static(DIST, { index: false }));
app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));

// ── Start ────────────────────────────────────────────────────
createServer(app).listen(PORT, () => {
  console.log(`VoyaIQ server running on port ${PORT}`);
  console.log(`Gemini AI: ${GEMINI_API_KEY ? '✓ configured' : '✗ missing GEMINI_API_KEY'}`);
});
