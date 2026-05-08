// ============================================================
// VoyaIQ — Gemini Chat Hook
// ============================================================
// All Gemini calls go through a Cloud Function proxy.
// The API key NEVER touches the client.

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import type { ChatMessage } from '@/types';
import { generateId } from '@/lib/utils';

/** Same-origin API endpoint — Gemini key lives in Cloud Run env, never the browser. */
const CHAT_ENDPOINT = '/api/chat';

async function getIdToken(): Promise<string> {
  const { auth } = await import('@/firebase');
  const token = await auth.currentUser?.getIdToken();
  return token ?? '';
}

/**
 * React hook for managing state and communication with the Gemini 2.5 Flash AI model.
 * @param itineraryContext - Optional serialized itinerary data to provide context to the AI
 * @returns An object containing chat state, messages, and functions to send or clear messages
 */
export function useGeminiChat(itineraryContext?: string) {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string, imageBase64?: string) => {
      if (!text.trim()) return;
      setError(null);

      const userMsg: ChatMessage = {
        id:        generateId(),
        role:      'user',
        content:   text,
        timestamp: new Date().toISOString(),
        imageUrl:  imageBase64,
      };
      setMessages((prev) => [...prev, userMsg]);

      const assistantMsg: ChatMessage = {
        id:          generateId(),
        role:        'model',
        content:     '',
        timestamp:   new Date().toISOString(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(true);

      try {
        const token = user ? await getIdToken() : '';
        const response = await fetch(CHAT_ENDPOINT, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages:          [...messages, userMsg].map((m) => ({
              role:    m.role,
              content: m.content,
            })),
            itineraryContext,
            imageBase64,
          }),
        });

        if (!response.ok) {
          throw new Error(`Chat error: ${response.status}`);
        }

        // Handle streaming response
        const reader  = response.body?.getReader();
        const decoder = new TextDecoder();
        let   full    = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            full += chunk;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, content: full } : m
              )
            );
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
          )
        );
      } catch {
        setError('Live Gemini service is unavailable (network, configuration/API key, or temporary outage). Showing offline assistant response.');
        // Fallback demo response when Cloud Functions aren't deployed
        const demoResponse = getDemoResponse(text);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: demoResponse, isStreaming: false }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, itineraryContext, user]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}

function getDemoResponse(query: string): string {
  const lower = query.toLowerCase();
  if (lower.includes('weather') || lower.includes('pack')) {
    return `Based on your itinerary, I'd recommend packing light layers — the destination typically sees **22–30°C** during your travel dates. 🌤️\n\n**Essential items:**\n- Light breathable clothing\n- Sunscreen SPF 50+\n- Comfortable walking shoes\n- Power adapter (if international)`;
  }
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('eat')) {
    return `I found some excellent dining options near your Day 3 activities! 🍽️\n\n**Top picks:**\n1. **Spice Garden** — Vegetarian-friendly, ₹400–600/person, 4.5⭐\n2. **The Coastal Kitchen** — Seafood specialist, ₹600–900/person, 4.7⭐\n3. **Green Bowl** — All-vegan menu, ₹300–500/person, 4.3⭐\n\nWould you like me to add one to your itinerary?`;
  }
  if (lower.includes('budget') || lower.includes('cost') || lower.includes('cheaper')) {
    return `I can optimize your budget! Here are 3 swaps that save ~₹2,400 while preserving trip quality: 💰\n\n1. Replace **5-star hotel** on Day 2 with a **boutique guesthouse** → Save ₹1,200\n2. Take **metro** instead of cab on Day 3 → Save ₹400\n3. Visit the free **heritage walk** instead of paid tour → Save ₹800\n\nShall I apply these changes?`;
  }
  return `I'm your VoyaIQ AI assistant! 🗺️ I can help you:\n- **Replace** activities ("find something quieter for Day 2 morning")\n- **Discover** restaurants and attractions near your activities\n- **Navigate** between locations with traffic-aware routing\n- **Pack** smart based on your destination and activities\n- **Optimize** your budget with smart swaps\n\nWhat would you like to know about your trip?`;
}
