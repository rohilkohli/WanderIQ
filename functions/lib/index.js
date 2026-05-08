"use strict";
// ============================================================
// WanderIQ — Cloud Functions (Gemini AI Proxy)
// ============================================================
// NOTE: This file is kept for reference / future Firebase Functions
// deployment. Active production proxy is server.mjs (Cloud Run).
// ============================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiAutoFill = exports.geminiDiscover = exports.geminiChat = void 0;
const functions = __importStar(require("firebase-functions/v2/https"));
const logger = __importStar(require("firebase-functions/logger"));
const generative_ai_1 = require("@google/generative-ai");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
/** Travel assistant system prompt for the Gemini model. */
const SYSTEM_PROMPT = `You are WanderIQ, an expert AI travel planning assistant.
You help users discover destinations, build multi-day itineraries, and plan smart trips.
You always consider the user's budget, dietary needs, mobility constraints, and travel style.
Keep responses concise, structured, and actionable. Use markdown formatting where appropriate.
When suggesting activities, include estimated costs in INR and duration in minutes.`;
// ── Gemini Chat Proxy ────────────────────────────────────────
exports.geminiChat = functions.onRequest({ cors: true, secrets: ['GEMINI_API_KEY'], timeoutSeconds: 60 }, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    // Verify Firebase ID token (optional — allows guest access)
    const authHeader = req.headers.authorization ?? '';
    if (authHeader.startsWith('Bearer ')) {
        try {
            await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
        }
        catch {
            logger.info('Unauthenticated chat request (guest mode)');
        }
    }
    const { messages, itineraryContext, imageBase64 } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'messages array required' });
        return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: 'Gemini API key not configured' });
        return;
    }
    try {
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: SYSTEM_PROMPT +
                (itineraryContext ? `\n\nCurrent itinerary context:\n${itineraryContext}` : ''),
        });
        const history = messages.slice(0, -1).map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
        }));
        const chat = model.startChat({ history });
        const lastMsg = messages[messages.length - 1];
        // Build multimodal parts array with correct Part types
        const parts = [];
        if (imageBase64) {
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });
        }
        parts.push({ text: lastMsg.content });
        // Stream response
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
        const result = await chat.sendMessageStream(parts);
        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text)
                res.write(text);
        }
        res.end();
    }
    catch (err) {
        logger.error('Gemini chat error:', err);
        res.status(500).json({ error: 'AI service temporarily unavailable' });
    }
});
// ── Gemini Discover — AI Destination Recommendations ────────
exports.geminiDiscover = functions.onRequest({ cors: true, secrets: ['GEMINI_API_KEY'], timeoutSeconds: 60 }, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { query, userLat, userLng, preferences } = req.body;
    if (!query) {
        res.status(400).json({ error: 'query is required' });
        return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: 'Gemini API key not configured' });
        return;
    }
    const locationHint = userLat && userLng
        ? `The user is currently at coordinates ${userLat.toFixed(2)}°N, ${userLng.toFixed(2)}°E.`
        : 'User location unknown. Show diverse Indian destinations.';
    const prompt = `${SYSTEM_PROMPT}

${locationHint}
User preferences: ${JSON.stringify(preferences ?? {})}
Query: "${query}"

Return a JSON array of exactly 5 destination recommendations. Each object:
{
  "id": "unique-slug",
  "name": "Destination Name",
  "country": "Country",
  "description": "2-3 sentence vivid description",
  "heroImageUrl": "https://images.unsplash.com/photo-[relevant-id]?w=800&q=80",
  "location": { "lat": 0.0, "lng": 0.0 },
  "rating": 4.5,
  "priceLevel": 2,
  "tags": ["Tag1", "Tag2", "Tag3"],
  "matchScore": 85,
  "matchReasons": ["Reason 1", "Reason 2"],
  "climate": { "tempMin": 22, "tempMax": 32, "rainProbability": 15, "condition": "sunny", "description": "Warm & sunny" },
  "bestFor": ["Solo", "Couples"]
}

Return ONLY the raw JSON array. No markdown fences.`;
    try {
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response
            .text()
            .trim()
            .replace(/^```json\n?/, '')
            .replace(/\n?```$/, '');
        const destinations = JSON.parse(text);
        res.json({ destinations });
    }
    catch (err) {
        logger.error('Gemini discover error:', err);
        res.status(500).json({ error: 'AI discovery service temporarily unavailable' });
    }
});
// ── Gemini Auto-Fill — AI Activity Suggestions ───────────────
exports.geminiAutoFill = functions.onRequest({ cors: true, secrets: ['GEMINI_API_KEY'], timeoutSeconds: 60 }, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { destination, slot, dayNumber, preferences, existingActivities } = req.body;
    if (!destination || !slot) {
        res.status(400).json({ error: 'destination and slot are required' });
        return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: 'Gemini API key not configured' });
        return;
    }
    const slotTimes = {
        morning: '6:00 AM – 12:00 PM',
        afternoon: '12:00 PM – 6:00 PM',
        evening: '6:00 PM – 11:00 PM',
    };
    const prompt = `${SYSTEM_PROMPT}

Generate 1 activity for Day ${dayNumber ?? 1} of a trip to ${destination}.
Time slot: ${slot} (${slotTimes[slot] ?? ''})
User preferences: ${JSON.stringify(preferences ?? {})}
Already planned today: ${(existingActivities ?? []).join(', ') || 'nothing yet'}
Do NOT suggest anything already planned.

Return a single JSON object:
{
  "name": "Activity Name",
  "category": "restaurant|attraction|nature|experience|wellness|shopping",
  "description": "2-sentence description",
  "address": "Full address in ${destination}",
  "location": { "lat": 0.0, "lng": 0.0 },
  "duration": 90,
  "estimatedCost": 500,
  "tags": ["Tag1", "Tag2"],
  "isWheelchairAccessible": false,
  "rating": 4.3
}

Return ONLY the raw JSON object. No markdown fences.`;
    try {
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response
            .text()
            .trim()
            .replace(/^```json\n?/, '')
            .replace(/\n?```$/, '');
        const activity = JSON.parse(text);
        res.json({ activity });
    }
    catch (err) {
        logger.error('Gemini auto-fill error:', err);
        res.status(500).json({ error: 'AI auto-fill service temporarily unavailable' });
    }
});
//# sourceMappingURL=index.js.map