// ============================================================
// WanderIQ — Express API Server (Pure JS / Cloud Run)
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

app.use(express.json({ limit: '4mb' }));

// ── Security Headers ─────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const SYSTEM_PROMPT = `You are WanderIQ, an expert AI travel planning assistant.
You help users discover destinations, build multi-day itineraries, and plan smart trips.
Always consider budget, dietary needs, mobility constraints, and travel style.
Keep responses concise, structured, and actionable. Use markdown formatting.
When suggesting activities, include estimated costs in INR and duration in minutes.`;

// ── POST /api/chat — Streaming Gemini Chat ───────────────────
app.post('/api/chat', async (req, res) => {
  const { messages, itineraryContext, imageBase64 } = req.body;
  if (!GEMINI_API_KEY) { res.status(503).json({ error: 'AI service not configured' }); return; }
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array required' }); return;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT + (itineraryContext ? `\n\nCurrent itinerary:\n${itineraryContext}` : ''),
    });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const lastMsg = messages[messages.length - 1];
    const parts = [];
    if (imageBase64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });
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
  if (!query) { res.status(400).json({ error: 'query required' }); return; }
  if (!GEMINI_API_KEY) { res.status(503).json({ error: 'AI service not configured' }); return; }

  const locationHint = userLat && userLng
    ? `User is currently near ${Number(userLat).toFixed(1)}°N, ${Number(userLng).toFixed(1)}°E. Prioritize reachable Indian destinations.`
    : 'Show diverse Indian destinations.';

  const prompt = `${SYSTEM_PROMPT}

${locationHint}
User preferences: ${JSON.stringify(preferences ?? {})}
Query: "${query}"

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
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim()
      .replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
    const destinations = JSON.parse(text);
    res.json({ destinations });
  } catch (err) {
    console.error('Discover error:', err);
    res.status(500).json({ error: 'Discovery service temporarily unavailable' });
  }
});

// ── POST /api/autofill — AI Activity Auto-fill ───────────────
app.post('/api/autofill', async (req, res) => {
  const { destination, slot, dayNumber, preferences, existingActivities } = req.body;
  if (!destination || !slot) { res.status(400).json({ error: 'destination and slot required' }); return; }
  if (!GEMINI_API_KEY) { res.status(503).json({ error: 'AI service not configured' }); return; }

  const slotTimes = { morning: '6:00 AM – 12:00 PM', afternoon: '12:00 PM – 6:00 PM', evening: '6:00 PM – 11:00 PM' };
  const existing = Array.isArray(existingActivities) ? existingActivities.join(', ') : 'nothing yet';

  const prompt = `${SYSTEM_PROMPT}

Generate 1 activity for Day ${dayNumber ?? 1} of a trip to ${destination}.
Time: ${slot} (${slotTimes[slot] ?? ''})
User preferences: ${JSON.stringify(preferences ?? {})}
Already planned today: ${existing}
Do NOT suggest anything already planned.

Return a single JSON object:
{
  "name": "Activity Name",
  "category": "restaurant|attraction|nature|experience|wellness|shopping",
  "description": "2 engaging sentences",
  "address": "Real street address in ${destination}",
  "location": { "lat": 0.0, "lng": 0.0 },
  "duration": 90,
  "estimatedCost": 500,
  "tags": ["Tag1", "Tag2"],
  "isWheelchairAccessible": false,
  "rating": 4.3
}

Return ONLY the raw JSON object. No markdown fences.`;

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim()
      .replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
    const activity = JSON.parse(text);
    res.json({ activity });
  } catch (err) {
    console.error('Autofill error:', err);
    res.status(500).json({ error: 'Auto-fill temporarily unavailable' });
  }
});

// ── POST /api/itinerary-generate — Full AI Trip Builder ──────
app.post('/api/itinerary-generate', async (req, res) => {
  const { destination, days, preferences, budget } = req.body;
  if (!destination || !days) { res.status(400).json({ error: 'destination and days required' }); return; }
  if (!GEMINI_API_KEY) { res.status(503).json({ error: 'AI service not configured' }); return; }

  const prompt = `${SYSTEM_PROMPT}

Build a complete ${days}-day itinerary for ${destination}.
Total budget: INR ${budget ?? 40000}
User preferences: ${JSON.stringify(preferences ?? {})}

Return a JSON array of ${days} day objects:
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
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim()
      .replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
    const itinerary = JSON.parse(text);
    res.json({ itinerary });
  } catch (err) {
    console.error('Itinerary generate error:', err);
    res.status(500).json({ error: 'Itinerary generation temporarily unavailable' });
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
  console.log(`WanderIQ server running on port ${PORT}`);
  console.log(`Gemini AI: ${GEMINI_API_KEY ? '✓ configured' : '✗ missing GEMINI_API_KEY'}`);
});
