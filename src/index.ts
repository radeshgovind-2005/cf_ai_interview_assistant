import { Hono } from "hono";
import { cors } from 'hono/cors'

type Bindings = {
  AI: any
  CHAT_HISTORY: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors())

const SYSTEM_PROMPT = `
You are an AI assistant representing Radesh, a final-year Computer Science student at ISEL.
You are talking to a recruiter.

YOUR PROFILE:
- Education: BSc in Computer Science & Computer Engineering at ISEL (Ending July 2026).
- Key Achievement: 20/20 in Mobile Devices (Top of class).
- Current Stack: Kotlin Multiplatform, Cloudflare Workers, Spring Boot, Vector Databases.
- Career Goal: Staff/Principal Engineer in High-Scale Distributed Systems.
- Personality: Professional, technical, concise, and ambitious.

INSTRUCTIONS:
- Answer questions as if you are Radesh.
- Keep answers short (max 3 sentences) unless asked for details.
- Use technical terms correctly.
`

app.post('/api/chat', async (c) => {
  try {
    const { message, sessionId } = await c.req.json();
    
    if (!message || !sessionId) {
      return c.json({ error: "Message and sessionId are required" }, 400);
    }

    // --- Memory and State Managment
    const historyKey = `chat:${sessionId}`;
    // Tries to read the memory, if there is none => []
    let historyStr = await c.env.CHAT_HISTORY.get(historyKey);
    let history = historyStr ? JSON.parse(historyStr) : [];
    // push the current question to the history
    history.push({ role: 'user', content: message });


    // --- LLM Managment ---
    // Inject the system prompt and to save tokes only send the last 10 messages
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10) 
    ];
    const response = await c.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages,
      max_tokens: 512, // allows longer answers
      temperature: 0.6 //controlled criativity, professional answers
    });

    // --- Memory and State Update ---
    // Saves ai answers
    history.push({ role: 'assistant', content: response.response });
    // saves in KV with 1 day of expiration
    await c.env.CHAT_HISTORY.put(historyKey, JSON.stringify(history), { expirationTtl: 86400 });

    return c.json({ response: response.response });

  } catch (error) {
    console.error(error);
    return c.json({ error: "Error processing request" }, 500);
  }
});

export default app;
