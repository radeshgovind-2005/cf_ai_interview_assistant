# AI Prompt Engineering Log (PROMPTS.md)

**Candidate:** Radesh
**Role:** Software Engineer Intern (Summer 2026)

## 🧠 Philosophy: AI as a Pair-Programming Partner
In building this application, I did not use AI to generate a complete codebase from scratch. Instead, I utilized LLMs (specifically Google Gemini / ChatGPT) as a **Senior Staff Engineer sparring partner**. 

My prompt engineering strategy followed a distinct lifecycle:
1. **Architecture & Trade-offs:** Discussing the best Cloudflare-native tools for the job.
2. **Refactoring & Modularity:** Breaking down monolithic scripts into Domain-Driven Design.
3. **Ruthless Critique:** Explicitly asking the AI to find flaws in my implementation to learn and improve.
4. **Debugging:** Using the AI to decipher obscure edge-runtime stack traces.

Below is a log of the key prompts used to shape this project.

---

### Phase 1: Architectural Foundation & Best Practices

Before writing code, I wanted to understand the absolute best-in-class architecture for an edge AI app on Cloudflare. I started with a working concept using KV, but sought to optimize it.

**Prompt:**
> "I am doing this assignment for a job recruitment. I built an AI Assistant using Cloudflare Workers, Hono, and Workers AI (Llama 3.3). Right now I am using Cloudflare KV to store the chat history. I want this project to feel like it was built by a Senior Edge Engineer. What are the architectural trade-offs here, and how can I upgrade this to guarantee strong consistency for chat sessions?"

**Outcome:** The AI explained that KV is *eventually consistent*, which can lead to race conditions in a fast-paced chat environment. It suggested migrating to **Durable Objects (DO)** to act as a stateful, strongly consistent transaction boundary. I adopted this architecture.

---

### Phase 2: Refactoring & Separation of Concerns

Initially, my `index.ts` was becoming a monolithic file containing routing, state logic, and a massive 100+ line system prompt. I knew this was poor engineering and asked the AI how to structure a production-grade repository.

**Prompt:**
> "This is my project file tree. First, tell me which files I should create, and where they should be. The system prompt is too long, and it's not good engineering. Should I save a space where I can put prompts like this, or my CV/links that the AI could use as a database? How can I abstract this properly so the logic is separated from the data?"

**Outcome:**
The AI guided me to implement a Domain-Driven folder structure (`src/data`, `src/durable_objects`, `src/utils`, `src/services`). It showed me how to treat my Resume as a static JSON data object and write a "Prompt Generator" function that dynamically injects my CV and the user's Edge location into the LLM context.

---

### Phase 3: The "Ruthless Critique" (Quality Assurance)

Once the application was running locally with Durable Objects and Hono, I wanted to ensure there were no hidden anti-patterns before committing. I asked the AI to review my implementation harshly.

**Prompt:**
> "It is running successfully and returning a 200 OK. What do you think? Be my biggest critique. I want to make a commit of this—suggest a name and description. Then tell me how I can make this better to achieve my goal of being 'irrefusable' to a hiring manager."

**Outcome:**
The AI pointed out three critical flaws I had missed:
1. **Dead Infrastructure:** I had left the old KV namespace bindings in my `wrangler.jsonc` file.
2. **Missing Telemetry:** I was extracting the user's City and Country, but I wasn't sending it back to the frontend to prove the edge-routing was working.
3. **Perceived Latency:** The AI pointed out that a 6.5-second inference wait time is too long without visual feedback. 

This feedback led directly to the implementation of the `X-Edge-Location` HTTP headers and the frontend UI telemetry display.

---

### Phase 4: Debugging Hono Immutable Responses

During the implementation of the custom Edge telemetry headers, I encountered a persistent server crash when the AI tried to return a response to the client.

**Prompt:**
> "Error: Connection lost with Workers AI. My terminal shows `GET /api/chat 404 Not Found` but the UI just shows the connection lost error. What is swallowing the error, and why is my POST request failing after adding the header logic?"

**Outcome:**
The AI helped me diagnose two issues:
1. I was hitting a `GET` route in the browser directly instead of letting the UI send the `POST` request.
2. More importantly, it taught me that **Hono response objects are immutable**. My attempt to use `finalResponse.headers.set()` was panicking the worker. The AI showed me the correct Hono context method (`c.header('Key', 'Value')`), which resolved the 500 Internal Server Error.

---

### Conclusion
By treating the LLM as an active reviewer rather than a code-generator, I was able to learn Cloudflare's Durable Object architecture, improve my TypeScript modularity, and build an edge-native application that is highly performant and observable.