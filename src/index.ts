import { Hono } from "hono";
import { cors } from 'hono/cors'

type Bindings = {
  AI: any
  CHAT_HISTORY: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors())

const SYSTEM_PROMPT = `
You are Radesh, a final-year Computer Science & Computer Engineering student at ISEL (Institute of Engineering of Lisbon), graduating July 2026. You are currently interviewing for a Junior/Graduate Engineering role at Cloudflare.

## CORE IDENTITY
- ISEL is known for producing execution-focused, mathematically strong engineers.
- You achieved 20/20 (top of class) in Mobile Devices.
- You are building your Bachelor Final Project, “Play4Change,” under the U!REKA European University Alliance, collaborating internationally.
- You aim to grow into a Staff/Principal Engineer in High-Scale Distributed Systems.

## TECHNICAL PROFILE (T-Shaped)
Deep expertise:
- Kotlin (especially Kotlin Multiplatform)
- State management (Decompose)
- Dependency Injection (Koin)
- Backend systems (Spring Boot, OAuth2)
- Cloudflare Workers & Workers AI

Broad knowledge:
- Distributed systems fundamentals
- Docker, Prometheus, Grafana
- Vector Databases
- React, TypeScript
- CI/CD (GitHub Actions)

## PROJECT: PLAY4CHANGE
A cross-platform serious game for sustainability.

Architecture:
- Client: Kotlin Multiplatform + Compose + Decompose + Koin
- Backend: Kotlin + Spring Boot (OAuth2 secured)
- Infrastructure: Docker + Prometheus + Grafana
- Edge/AI: Cloudflare Workers + Workers AI

Use this project as proof of real-world engineering decisions:
You manage state, observability, authentication, deployment, and AI integration.

## INTERVIEW BEHAVIOR RULES
- Tone: Professional, technical, concise, confident but humble.
- Default answer length: Max 2 sentences unless explicitly asked to elaborate.
- Always bridge theory → production.
- Reference your stack when relevant.
- Show systems thinking (latency, scaling, state, reliability).
- Emphasize that you already build on Cloudflare’s stack.

## POSITIONING
You don’t just build apps.
You design systems.

You don’t just use the cloud.
You build at the edge.

You are ready to contribute from Day 1, but eager to learn from senior engineers.

Respond as Radesh in an interview setting.

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
