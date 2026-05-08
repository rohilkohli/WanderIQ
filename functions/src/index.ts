// ============================================================
// WanderIQ — Cloud Functions (Gemini AI Proxy)
// ============================================================
// Gemini API key NEVER reaches the client browser.
// All AI calls are proxied securely through these functions.

import * as functions from 'firebase-functions/v2/https';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as admin from 'firebase-admin';

admin.initializeApp();

/** Travel assistant system prompt for the Gemini model. */
const SYSTEM_PROMPT = `You are WanderIQ, an expert AI travel planning assistant. 
You help users discover destinations, build multi-day itineraries, and plan smart trips.
You always consider the user's budget, dietary needs, mobility constraints, and travel style.
Keep responses concise, structured, and actionable. Use markdown formatting where appropriate.
When suggesting activities, include estimated costs in INR and duration in minutes.`;

// ── Gemini Chat Proxy ────────────────────────────────────────
export const geminiChat = functions.onRequest(
  { cors: true, secrets: ['GEMINI_API_KEY'], timeoutSeconds: 60 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Verify Firebase ID token
    const authHeader = req.headers.authorization ?? '';
    if (authHeader.startsWith('Bearer ')) {
      try {
        await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
      } catch {
        // Allow anonymous/guest users — just log
        functions.logger.info('Unauthenticated chat request (guest mode)');
      }
    }

    const { messages, itineraryContext, imageBase64 } = req.body as {
      messages: Array<{ role: string; content: string }>;
      itineraryContext?: string;
      imageBase64?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Gemini API key not configured' });
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: SYSTEM_PROMPT + (itineraryContext ? `\n\nCurrent itinerary context:\n${itineraryContext}` : ''),
      });

      // Build chat history (exclude last user message — it's the prompt)
      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({ history });
      const lastMsg = messages[messages.length - 1];

      // Support multimodal (image + text)
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
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
        if (text) res.write(text);
      }
      res.end();
    } catch (err) {
      functions.logger.error('Gemini chat error:', err);
      res.status(500).json({ error: 'AI service temporarily unavailable' });
    }
  }
);

// ── Gemini Discover — AI Destination Recommendations ────────
export const geminiDiscover = functions.onRequest(
  { cors: true, secrets: ['GEMINI_API_KEY'], timeoutSeconds: 60 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { query, userLat, userLng, preferences } = req.body as {
      query: string;
      userLat?: number;
      userLng?: number;
      preferences?: Record<string, unknown>;
    };

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
      ? `The user is currently at coordinates ${userLat.toFixed(2)}, ${userLng.toFixed(2)} (likely in India).`
      : '';

    const prompt = `${SYSTEM_PROMPT}

${locationHint}
User preferences: ${JSON.stringify(preferences ?? {})}

The user is looking for travel destinations with this query: "${query}"

Return a JSON array of exactly 5 destination recommendations. Each object must have:
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

Return ONLY the raw JSON array, no markdown fences, no explanation.`;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      // Strip markdown fences if model adds them
      const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      const destinations = JSON.parse(clean);

      res.json({ destinations });
    } catch (err) {
      functions.logger.error('Gemini discover error:', err);
      res.status(500).json({ error: 'AI discovery service temporarily unavailable' });
    }
  }
);

// ── Gemini Auto-Fill — AI Activity Suggestions ───────────────
export const geminiAutoFill = functions.onRequest(
  { cors: true, secrets: ['GEMINI_API_KEY'], timeoutSeconds: 60 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { destination, slot, dayNumber, preferences, existingActivities } = req.body as {
      destination: string;
      slot: 'morning' | 'afternoon' | 'evening';
      dayNumber: number;
      preferences?: Record<string, unknown>;
      existingActivities?: string[];
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Gemini API key not configured' });
      return;
    }

    const slotTimes: Record<string, string> = {
      morning: '6:00 AM – 12:00 PM',
      afternoon: '12:00 PM – 6:00 PM',
      evening: '6:00 PM – 11:00 PM',
    };

    const prompt = `${SYSTEM_PROMPT}

Generate 1 activity for day ${dayNumber} of a trip to ${destination}.
Time slot: ${slot} (${slotTimes[slot]})
User preferences: ${JSON.stringify(preferences ?? {})}
Already scheduled today: ${(existingActivities ?? []).join(', ') || 'nothing yet'}

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

Return ONLY the raw JSON object, no markdown fences.`;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      const activity = JSON.parse(clean);

      res.json({ activity });
    } catch (err) {
      functions.logger.error('Gemini auto-fill error:', err);
      res.status(500).json({ error: 'AI auto-fill service temporarily unavailable' });
    }
  }
);
