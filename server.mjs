// ============================================================
// VoyaIQ — Express API Server (Pure JS / Cloud Run)
// Serves the React SPA + proxies AI providers securely
// ============================================================

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { SYSTEM_PROMPT, buildPrompt, getConfiguredFallbackOrder, parseModelJson, sanitizeText } from './ai-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const COHERE_API_KEY = process.env.COHERE_API_KEY || '';
const COHERE_MODEL = process.env.COHERE_MODEL || 'command-r-plus';
const SUPPORTED_PROVIDERS = ['gemini', 'openai', 'cohere'];

const geminiClient = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const MAX_MESSAGE_LENGTH = 2000;
const MAX_CONTEXT_LENGTH = 12000;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const AI_LOG_LIMIT = 300;
const FEEDBACK_LIMIT = 200;

const FALLBACK_ORDER = (process.env.AI_PROVIDER_FALLBACK || 'gemini,openai,cohere')
  .split(',')
  .map((item) => sanitizeText(item, 32).toLowerCase())
  .filter((item) => SUPPORTED_PROVIDERS.includes(item));

const providerHealth = {
  gemini: { configured: Boolean(GEMINI_API_KEY), healthy: Boolean(GEMINI_API_KEY), lastError: null, degradedAt: null },
  openai: { configured: Boolean(OPENAI_API_KEY), healthy: Boolean(OPENAI_API_KEY), lastError: null, degradedAt: null },
  cohere: { configured: Boolean(COHERE_API_KEY), healthy: Boolean(COHERE_API_KEY), lastError: null, degradedAt: null },
};

/** TODO(anthropic): implement callAnthropic() with Claude chat + JSON mode support when key/model are configured. */
const aiLogs = [];
const aiFeedback = [];
/** TODO(vector-memory): replace this with durable vector memory store (pgvector, Pinecone, Weaviate). In-memory only; resets on restart. */
const userMemory = new Map();

app.use(express.json({ limit: '4mb' }));

// ── Security Headers ─────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const AiStatus = {
  VALIDATED: 'validated',
  VALIDATED_FALLBACK: 'validated_fallback',
};

const latLngSchema = z.object({
  lat: z.coerce.number().finite(),
  lng: z.coerce.number().finite(),
});

const destinationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  country: z.string().min(1),
  description: z.string().min(1),
  heroImageUrl: z.string().url(),
  location: latLngSchema,
  rating: z.coerce.number().min(0).max(5).optional(),
  priceLevel: z.coerce.number().min(1).max(4).optional(),
  tags: z.array(z.string()).default([]),
  matchScore: z.coerce.number().min(0).max(100),
  matchReasons: z.array(z.string()).default([]),
  climate: z
    .object({
      tempMin: z.coerce.number(),
      tempMax: z.coerce.number(),
      rainProbability: z.coerce.number().min(0).max(100),
      condition: z.string(),
      description: z.string(),
    })
    .optional(),
  bestFor: z.array(z.string()).optional(),
});

const activitySchema = z.object({
  name: z.string().min(1),
  category: z.enum(['restaurant', 'attraction', 'nature', 'experience', 'wellness', 'shopping']),
  description: z.string().min(1),
  address: z.string().min(1),
  location: latLngSchema,
  duration: z.coerce.number().min(15).max(1440),
  estimatedCost: z.coerce.number().min(0),
  tags: z.array(z.string()).default([]),
  isWheelchairAccessible: z.boolean().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
});

const itineraryDaySchema = z.object({
  dayNumber: z.coerce.number().min(1),
  morning: z.array(activitySchema).default([]),
  afternoon: z.array(activitySchema).default([]),
  evening: z.array(activitySchema).default([]),
});

const budgetSuggestionSchema = z.object({
  title: z.string().min(1),
  savings: z.coerce.number().min(0),
  impact: z.enum(['low', 'medium', 'high']),
  desc: z.string().min(1),
});

const packingSchema = z.object({
  name: z.string().min(1),
  icon: z.string().min(1),
  items: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      category: z.string().min(1),
      checked: z.boolean(),
      isCustom: z.boolean(),
    })
  ),
});

const feedbackSchema = z.object({
  feature: z.enum(['chat', 'discover', 'autofill', 'budget', 'itinerary', 'packing']),
  responseId: z.string().min(1).max(120),
  rating: z.enum(['up', 'down', 'corrected']),
  correction: z.string().max(500).optional(),
  model: z.string().max(80).optional(),
  provider: z.string().max(40).optional(),
});

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

function logAiEvent(entry) {
  const normalized = {
    timestamp: new Date().toISOString(),
    ...entry,
  };
  aiLogs.push(normalized);
  if (aiLogs.length > AI_LOG_LIMIT) aiLogs.shift();
  console.log(`[ai] ${JSON.stringify(normalized)}`);
}

function setProviderHealthy(provider) {
  providerHealth[provider].healthy = true;
  providerHealth[provider].lastError = null;
  providerHealth[provider].degradedAt = null;
}

function setProviderDegraded(provider, err) {
  providerHealth[provider].healthy = false;
  providerHealth[provider].lastError = sanitizeText(err instanceof Error ? err.message : String(err), 240);
  providerHealth[provider].degradedAt = new Date().toISOString();
}

function getUserId(req) {
  const raw = req.headers['x-ai-user-id'] || req.headers['x-user-id'] || req.body?.userId || 'anonymous';
  return sanitizeText(String(raw), 80) || 'anonymous';
}

function normalizeUserContext(raw) {
  const context = raw && typeof raw === 'object' ? raw : {};
  const toCleanList = (value, cap = 6, maxLen = 140) =>
    Array.isArray(value)
      ? value.map((item) => sanitizeText(String(item), maxLen)).filter(Boolean).slice(-cap)
      : [];

  return {
    preferences: context.preferences && typeof context.preferences === 'object' ? context.preferences : {},
    recentActions: toCleanList(context.recentActions, 8, 180),
    recentRatings: Array.isArray(context.recentRatings)
      ? context.recentRatings
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            return {
              feature: sanitizeText(String(item.feature || ''), 40),
              responseId: sanitizeText(String(item.responseId || ''), 120),
              rating: sanitizeText(String(item.rating || ''), 20),
              correction: sanitizeText(String(item.correction || ''), 180),
            };
          })
          .filter(Boolean)
          .slice(-6)
      : [],
  };
}

function getUserContext(req) {
  const userId = getUserId(req);
  const existing = userMemory.get(userId) || { preferences: {}, recentActions: [], recentRatings: [] };
  const incoming = normalizeUserContext(req.body?.userContext);

  const merged = {
    preferences: { ...existing.preferences, ...incoming.preferences },
    recentActions: [...existing.recentActions, ...incoming.recentActions].slice(-8),
    recentRatings: [...existing.recentRatings, ...incoming.recentRatings].slice(-8),
  };

  userMemory.set(userId, merged);
  return { userId, userContext: merged };
}

function rememberUserAction(userId, action) {
  const safeAction = sanitizeText(action, 160);
  if (!safeAction) return;
  const existing = userMemory.get(userId) || { preferences: {}, recentActions: [], recentRatings: [] };
  existing.recentActions = [...existing.recentActions, safeAction].slice(-8);
  userMemory.set(userId, existing);
}

function rememberUserFeedback(userId, feedback) {
  const existing = userMemory.get(userId) || { preferences: {}, recentActions: [], recentRatings: [] };
  existing.recentRatings = [
    ...existing.recentRatings,
    {
      feature: sanitizeText(feedback.feature, 40),
      responseId: sanitizeText(feedback.responseId || '', 120),
      rating: sanitizeText(feedback.rating, 20),
      correction: sanitizeText(feedback.correction || '', 180),
    },
  ].slice(-8);
  userMemory.set(userId, existing);
}

async function callGemini({ mode, systemInstruction, prompt, parts }) {
  if (!geminiClient) throw new Error('Gemini client unavailable');
  const model = geminiClient.getGenerativeModel({
    model: GEMINI_MODEL,
    ...(systemInstruction ? { systemInstruction } : {}),
    ...(mode === 'json' ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
  });

  if (mode === 'stream') {
    const history = Array.isArray(parts?.history) ? parts.history : [];
    const chat = model.startChat({ history });
    const streamResult = await chat.sendMessageStream(parts?.parts || [{ text: prompt }]);
    return { stream: streamResult.stream, model: GEMINI_MODEL };
  }

  const result = await model.generateContent(prompt);
  return { text: result.response.text(), model: GEMINI_MODEL };
}

async function callOpenAI({ mode, systemInstruction, prompt }) {
  if (!OPENAI_API_KEY) throw new Error('OpenAI key missing');
  if (mode === 'stream') {
    throw new Error('OpenAI streaming is not currently supported as a fallback provider. Streaming is only available with Gemini; ensure Gemini is configured.');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemInstruction || SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      response_format: mode === 'json' ? { type: 'json_object' } : undefined,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== 'string') throw new Error('OpenAI empty response');
  return { text, model: OPENAI_MODEL };
}

async function callCohere({ mode, prompt }) {
  if (!COHERE_API_KEY) throw new Error('Cohere key missing');
  if (mode === 'stream') {
    throw new Error('Cohere streaming is not currently supported as a fallback provider. Streaming is only available with Gemini; ensure Gemini is configured.');
  }

  const res = await fetch('https://api.cohere.ai/v2/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${COHERE_API_KEY}`,
    },
    body: JSON.stringify({
      model: COHERE_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: mode === 'json' ? { type: 'json_object' } : undefined,
    }),
  });

  if (!res.ok) {
    throw new Error(`Cohere ${res.status}`);
  }

  const data = await res.json();
  const text = data?.message?.content?.[0]?.text;
  if (!text || typeof text !== 'string') throw new Error('Cohere empty response');
  return { text, model: COHERE_MODEL };
}

async function callProvider(provider, { mode, systemInstruction, prompt, parts }) {
  if (provider === 'gemini') return callGemini({ mode, systemInstruction, prompt, parts });
  if (provider === 'openai') return callOpenAI({ mode, systemInstruction, prompt, parts });
  return callCohere({ mode, systemInstruction, prompt, parts });
}

async function runWithFallback({ endpoint, mode, prompt, systemInstruction, schema, parts }) {
  const providers = getConfiguredFallbackOrder(FALLBACK_ORDER);
  const attemptErrors = [];

  for (let index = 0; index < providers.length; index += 1) {
    const provider = providers[index];
    if (!providerHealth[provider]?.configured) continue;

    try {
      const result = await callProvider(provider, { mode, systemInstruction, prompt, parts });
      setProviderHealthy(provider);

      if (mode === 'stream') {
        return {
          provider,
          model: result.model,
          stream: result.stream,
          fallbackUsed: index > 0,
        };
      }

      const rawPayload = mode === 'json' ? parseModelJson(result.text) : sanitizeText(result.text, 200000);
      const parsed = schema.safeParse(rawPayload);
      if (!parsed.success) {
        const issueSummary = parsed.error.issues.map((issue) => issue.path.join('.') + ':' + issue.message).slice(0, 5);
        throw new Error(`Validation failed (${issueSummary.join(', ')})`);
      }

      return {
        provider,
        model: result.model,
        fallbackUsed: index > 0,
        data: parsed.data,
      };
    } catch (err) {
      setProviderDegraded(provider, err);
      const safeMessage = sanitizeText(err instanceof Error ? err.message : String(err), 220);
      attemptErrors.push({ provider, error: safeMessage });
      logAiEvent({ endpoint, event: 'provider_failed', provider, error: safeMessage });
    }
  }

  const error = new Error('All configured AI providers failed');
  error.attemptErrors = attemptErrors;
  throw error;
}

function writeChatMetaHeaders(res, run) {
  res.setHeader('X-AI-Provider', run.provider);
  res.setHeader('X-AI-Model', run.model);
  res.setHeader('X-AI-Validated', 'true');
  res.setHeader('X-AI-Fallback', run.fallbackUsed ? 'true' : 'false');
}

function buildMeta(run) {
  return {
    provider: run.provider,
    model: run.model,
    validated: true,
    fallbackUsed: run.fallbackUsed,
    status: run.fallbackUsed ? AiStatus.VALIDATED_FALLBACK : AiStatus.VALIDATED,
  };
}

function handleAiFailure(res, endpoint, err) {
  const attempts = Array.isArray(err?.attemptErrors) ? err.attemptErrors : [];
  logAiEvent({ endpoint, event: 'request_failed', attempts, error: sanitizeText(err?.message || 'Unknown AI error', 220) });
  res.status(502).json({
    error: 'AI response failed validation or provider execution',
    details: attempts,
    status: 'validation_failed',
  });
}

// ── POST /api/chat — Streaming chat with fallback ──────────────
app.post('/api/chat', async (req, res) => {
  const { messages, itineraryContext, imageBase64 } = req.body;
  const safeMessages = sanitizeMessages(messages);
  if (safeMessages.length === 0) {
    res.status(400).json({ error: 'messages array required' });
    return;
  }

  const { userId, userContext } = getUserContext(req);
  const safeContext = sanitizeText(itineraryContext, MAX_CONTEXT_LENGTH);
  const safeImage = sanitizeImageBase64(imageBase64);

  const history = safeMessages.slice(0, -1).map((message) => ({
    role: message.role,
    parts: [{ text: message.content }],
  }));
  const lastMessage = safeMessages[safeMessages.length - 1];

  const prompt = buildPrompt({
    task: 'chat',
    instruction: 'Answer the user message with concise, practical travel help.',
    payload: {
      latestMessage: lastMessage.content,
      itineraryContext: safeContext,
    },
    userContext,
    outputContract: 'Return plain markdown text. No JSON wrappers.',
  });

  const parts = [];
  if (safeImage) parts.push({ inlineData: { mimeType: 'image/jpeg', data: safeImage } });
  parts.push({ text: `${prompt}\n\nUser message: ${lastMessage.content}` });

  try {
    const run = await runWithFallback({
      endpoint: '/api/chat',
      mode: 'stream',
      prompt,
      schema: z.string().min(1),
      parts: { history, parts },
    });

    writeChatMetaHeaders(res, run);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');

    let fullText = '';

    if (run.stream) {
      for await (const chunk of run.stream) {
        const text = chunk?.text ? chunk.text() : '';
        if (text) {
          fullText += text;
          res.write(text);
        }
      }
    }

    if (!fullText.trim()) throw new Error('Empty streamed response');

    rememberUserAction(userId, `chat:${lastMessage.content.slice(0, 80)}`);
    logAiEvent({ endpoint: '/api/chat', event: 'request_succeeded', userId, ...buildMeta(run), chars: fullText.length });
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      handleAiFailure(res, '/api/chat', err);
    }
  }
});

// ── POST /api/discover — AI Destination Discovery ────────────
app.post('/api/discover', async (req, res) => {
  const { query, userLat, userLng, preferences } = req.body;
  const safeQuery = sanitizeText(query, 300);
  if (!safeQuery) {
    res.status(400).json({ error: 'query required' });
    return;
  }

  const { userId, userContext } = getUserContext(req);
  userContext.preferences = { ...userContext.preferences, ...(preferences && typeof preferences === 'object' ? preferences : {}) };

  const hasLocation = Number.isFinite(Number(userLat)) && Number.isFinite(Number(userLng));
  const locationHint = hasLocation
    ? `User is currently near ${Number(userLat).toFixed(1)}°N, ${Number(userLng).toFixed(1)}°E.`
    : 'User location unavailable.';

  const prompt = buildPrompt({
    task: 'discover',
    instruction: 'Recommend destination options that best match user intent and constraints.',
    payload: { query: safeQuery, locationHint },
    userContext,
    outputContract: `Return ONLY raw JSON array of destination objects using this schema:
[{"id":"slug","name":"Name","country":"India","description":"text","heroImageUrl":"https://images.unsplash.com/photo-...","location":{"lat":0,"lng":0},"rating":4.5,"priceLevel":2,"tags":["tag"],"matchScore":85,"matchReasons":["reason"],"climate":{"tempMin":22,"tempMax":32,"rainProbability":15,"condition":"sunny","description":"Warm"},"bestFor":["Solo"]}]`,
  });

  try {
    const run = await runWithFallback({
      endpoint: '/api/discover',
      mode: 'json',
      prompt,
      schema: z.array(destinationSchema).min(1).max(8),
    });

    rememberUserAction(userId, `discover:${safeQuery.slice(0, 80)}`);
    logAiEvent({ endpoint: '/api/discover', event: 'request_succeeded', userId, ...buildMeta(run), items: run.data.length });
    res.json({ destinations: run.data, meta: buildMeta(run) });
  } catch (err) {
    handleAiFailure(res, '/api/discover', err);
  }
});

// ── POST /api/autofill — AI Activity Auto-fill ───────────────
app.post('/api/autofill', async (req, res) => {
  const { destination, slot, dayNumber, preferences, existingActivities } = req.body;
  const safeDestination = sanitizeText(destination, 120);
  const safeSlot = sanitizeText(slot, 20);

  if (!safeDestination || !safeSlot) {
    res.status(400).json({ error: 'destination and slot required' });
    return;
  }

  const slotTimes = {
    morning: '6:00 AM – 12:00 PM',
    afternoon: '12:00 PM – 6:00 PM',
    evening: '6:00 PM – 11:00 PM',
  };

  if (!slotTimes[safeSlot]) {
    res.status(400).json({ error: 'invalid slot' });
    return;
  }

  const { userId, userContext } = getUserContext(req);
  userContext.preferences = { ...userContext.preferences, ...(preferences && typeof preferences === 'object' ? preferences : {}) };

  const existing = Array.isArray(existingActivities)
    ? existingActivities.map((activity) => sanitizeText(activity, 120)).filter(Boolean)
    : [];

  const prompt = buildPrompt({
    task: 'autofill',
    instruction: 'Generate exactly one non-duplicate activity for the requested day slot.',
    payload: {
      destination: safeDestination,
      slot: safeSlot,
      dayNumber: Math.max(1, Number(dayNumber) || 1),
      slotTime: slotTimes[safeSlot],
      existingActivities: existing,
    },
    userContext,
    outputContract: `Return ONLY raw JSON object with schema:
{"name":"Activity","category":"restaurant|attraction|nature|experience|wellness|shopping","description":"text","address":"address","location":{"lat":0,"lng":0},"duration":90,"estimatedCost":500,"tags":["tag"],"isWheelchairAccessible":false,"rating":4.2}`,
  });

  try {
    const run = await runWithFallback({
      endpoint: '/api/autofill',
      mode: 'json',
      prompt,
      schema: activitySchema,
    });

    rememberUserAction(userId, `autofill:${safeDestination}:${safeSlot}`);
    logAiEvent({ endpoint: '/api/autofill', event: 'request_succeeded', userId, ...buildMeta(run) });
    res.json({ activity: run.data, meta: buildMeta(run) });
  } catch (err) {
    handleAiFailure(res, '/api/autofill', err);
  }
});

// ── POST /api/itinerary-generate — Full AI Trip Builder ──────
app.post('/api/itinerary-generate', async (req, res) => {
  const { destination, days, preferences, budget } = req.body;
  const safeDestination = sanitizeText(destination, 120);
  const safeDays = Math.min(21, Math.max(1, Number(days) || 0));
  const safeBudget = Math.max(1, Number(budget) || 40000);

  if (!safeDestination || !safeDays) {
    res.status(400).json({ error: 'destination and days required' });
    return;
  }

  const { userId, userContext } = getUserContext(req);
  userContext.preferences = { ...userContext.preferences, ...(preferences && typeof preferences === 'object' ? preferences : {}) };

  const prompt = buildPrompt({
    task: 'autofill',
    instruction: `Build a complete ${safeDays}-day itinerary with 1-2 activities per slot and realistic budget distribution.`,
    payload: { destination: safeDestination, days: safeDays, totalBudget: safeBudget },
    userContext,
    outputContract: `Return ONLY raw JSON array of ${safeDays} day objects with schema:
[{"dayNumber":1,"morning":[],"afternoon":[],"evening":[]}]
Each activity in slots must use the autofill activity schema.`,
  });

  try {
    const run = await runWithFallback({
      endpoint: '/api/itinerary-generate',
      mode: 'json',
      prompt,
      schema: z.array(itineraryDaySchema).min(1).max(safeDays),
    });

    rememberUserAction(userId, `itinerary:${safeDestination}:${safeDays}d`);
    logAiEvent({ endpoint: '/api/itinerary-generate', event: 'request_succeeded', userId, ...buildMeta(run), days: run.data.length });
    res.json({ itinerary: run.data, meta: buildMeta(run) });
  } catch (err) {
    handleAiFailure(res, '/api/itinerary-generate', err);
  }
});

// ── POST /api/packing-generate — AI Packing List ───────────────
app.post('/api/packing-generate', async (req, res) => {
  const { destination, days, tripType, weather, preferences } = req.body;
  const safeDestination = sanitizeText(destination, 120);
  const safeDays = Math.min(30, Math.max(1, Number(days) || 5));

  if (!safeDestination) {
    res.status(400).json({ error: 'destination required' });
    return;
  }

  const { userId, userContext } = getUserContext(req);
  userContext.preferences = {
    ...userContext.preferences,
    ...(preferences && typeof preferences === 'object' ? preferences : {}),
    tripType: sanitizeText(tripType, 80) || 'General',
    weather: sanitizeText(weather, 80) || 'Unknown',
  };

  const prompt = buildPrompt({
    task: 'packing',
    instruction: `Create a concise, practical packing list for a ${safeDays}-day trip.`,
    payload: {
      destination: safeDestination,
      days: safeDays,
      tripType: sanitizeText(tripType, 80) || 'General',
      weather: sanitizeText(weather, 80) || 'Unknown',
    },
    userContext,
    outputContract: `Return ONLY raw JSON array with schema:
[{"name":"Clothing","icon":"👕","items":[{"id":"id","name":"Item","category":"Clothing","checked":false,"isCustom":false}]}]`,
  });

  try {
    const run = await runWithFallback({
      endpoint: '/api/packing-generate',
      mode: 'json',
      prompt,
      schema: z.array(packingSchema).min(1).max(20),
    });

    rememberUserAction(userId, `packing:${safeDestination}:${safeDays}d`);
    logAiEvent({ endpoint: '/api/packing-generate', event: 'request_succeeded', userId, ...buildMeta(run), categories: run.data.length });
    res.json({ categories: run.data, meta: buildMeta(run) });
  } catch (err) {
    handleAiFailure(res, '/api/packing-generate', err);
  }
});

// ── POST /api/budget-optimize — AI Budget Suggestions ──────────
app.post('/api/budget-optimize', async (req, res) => {
  const { destination, breakdown, total, preferences } = req.body;
  const safeTotal = Number(total);
  if (!breakdown || !Number.isFinite(safeTotal) || safeTotal <= 0) {
    res.status(400).json({ error: 'breakdown and total required' });
    return;
  }

  const { userId, userContext } = getUserContext(req);
  userContext.preferences = { ...userContext.preferences, ...(preferences && typeof preferences === 'object' ? preferences : {}) };

  const prompt = buildPrompt({
    task: 'budget',
    instruction: 'Analyze budget and suggest 3 practical savings ideas without reducing core experience.',
    payload: {
      destination: sanitizeText(destination, 120) || 'Unknown',
      totalBudget: Math.round(safeTotal),
      breakdown,
    },
    userContext,
    outputContract: `Return ONLY raw JSON array with schema:
[{"title":"Short title","savings":1500,"impact":"low|medium|high","desc":"One sentence"}]`,
  });

  try {
    const run = await runWithFallback({
      endpoint: '/api/budget-optimize',
      mode: 'json',
      prompt,
      schema: z.array(budgetSuggestionSchema).min(1).max(6),
    });

    rememberUserAction(userId, `budget:${sanitizeText(destination, 50) || 'unknown'}`);
    logAiEvent({ endpoint: '/api/budget-optimize', event: 'request_succeeded', userId, ...buildMeta(run), suggestions: run.data.length });
    res.json({ suggestions: run.data, meta: buildMeta(run) });
  } catch (err) {
    handleAiFailure(res, '/api/budget-optimize', err);
  }
});

// ── POST /api/ai-feedback — user rating/correction ─────────────
app.post('/api/ai-feedback', (req, res) => {
  const parsed = feedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid feedback payload' });
    return;
  }

  const { userId } = getUserContext(req);
  const record = {
    userId,
    createdAt: new Date().toISOString(),
    ...parsed.data,
  };

  aiFeedback.push(record);
  if (aiFeedback.length > FEEDBACK_LIMIT) aiFeedback.shift();
  rememberUserFeedback(userId, parsed.data);

  logAiEvent({ endpoint: '/api/ai-feedback', event: 'feedback_received', userId, feature: parsed.data.feature, rating: parsed.data.rating });
  res.json({ ok: true });
});

// ── GET /api/admin/ai-logs — dev observability feed ───────────
app.get('/api/admin/ai-logs', (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const logs = aiLogs.slice(-limit);
  res.json({
    summary: {
      totalLogs: aiLogs.length,
      totalFeedback: aiFeedback.length,
      fallbackOrder: getConfiguredFallbackOrder(FALLBACK_ORDER),
    },
    providerHealth,
    logs,
    feedback: aiFeedback.slice(-limit),
  });
});

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    providers: providerHealth,
    fallbackOrder: getConfiguredFallbackOrder(FALLBACK_ORDER),
    logCount: aiLogs.length,
    feedbackCount: aiFeedback.length,
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
  console.log(`AI providers: ${JSON.stringify({
    gemini: providerHealth.gemini.configured,
    openai: providerHealth.openai.configured,
    cohere: providerHealth.cohere.configured,
  })}`);
});
