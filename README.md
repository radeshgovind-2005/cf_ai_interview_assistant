# cf_ai_interview_assistant

An edge-native, AI-powered interview assistant built for the Cloudflare Software Engineer Intern (Summer 2026) application. 

This project goes beyond a simple LLM wrapper. It is a stateful, edge-deployed distributed system that demonstrates real-time AI inference, strong state consistency, and geographic observability. Radesh's AI Agent acts as an interactive resume, leveraging the candidate's actual profile to answer recruiter questions dynamically.

## 🎥 Live Demo & Deployment

* **🟢 Live Application:** [Web App Link](https://cold-resonance-d00c.radesh-govind.workers.dev)
* **📼 Video Walkthrough:** [INSERT LINK TO YOUTUBE/LOOM VIDEO HERE]

---

## 📋 Assignment Requirements Mapping

This project strictly adheres to the Cloudflare AI-powered application guidelines:
* **LLM:** Utilizes `@cf/meta/llama-3.3-70b-instruct-fp8-fast` on Workers AI.
* **Workflow / Coordination:** Utilizes **Durable Objects** to guarantee strong consistency for chat sessions.
* **User Input:** Custom HTML5/CSS3 frontend served via Cloudflare Assets.
* **Memory or State:** Chat history is persisted utilizing Durable Object Storage API.
* **Repository:** Prefixed with `cf_ai_` and includes the required `PROMPTS.md` file.

---

## 🏗 System Architecture & The "Why"

Cloudflare's network operates within 50 milliseconds of 95% of the Internet-connected population. Building for the edge requires a fundamental shift in how we handle state and latency.

### 1. State Management: Durable Objects vs. KV
Initially, this project could have used Cloudflare KV to store chat history. However, KV relies on *eventual consistency*. In a conversational UI, rapid successive messages from a user could result in race conditions, causing the edge replica to overwrite or desync the history array. 

**The Solution:** I migrated state management to **Durable Objects (DO)**. A Durable Object acts as a single-threaded execution environment (an Actor model) for a specific chat session. All requests for a given `sessionId` are routed to the exact same global node hosting that DO, ensuring strict serialization of messages, robust locking, and strong consistency when saving context to disk.

### 2. Edge Observability & Telemetry
A core advantage of Cloudflare Workers is executing code at the network edge. To visualize this, the API Gateway (`index.ts`) intercepts the incoming request and parses the Cloudflare-specific TLS metadata (`req.raw.cf`). It extracts the user's `city` and `country` and passes this to the LLM for location-aware prompting. Finally, it returns custom `X-Edge-Location` headers back to the frontend, proving to the user exactly where their inference was run.

---

## 🧠 Code Deep Dive: Module by Module

This application is built using Domain-Driven Design principles, separating routing, state, business logic, and data.

### 1. The API Gateway (`src/index.ts`)
Powered by **Hono**, an ultrafast, edge-optimized web framework.
* **Responsibilities:** Cross-Origin Resource Sharing (CORS), request validation, and routing.
* **Implementation Detail:** When a `POST /api/chat` request arrives, Hono generates a stub (a remote pointer) to the specific Durable Object mapped to the `sessionId`. It does not process the AI logic itself; it acts merely as a fast proxy, passing the payload and the extracted geographic telemetry down to the DO.

### 2. The State Machine (`src/durable_objects/ChatSession.ts`)
This is the heart of the application's memory.
* **Responsibilities:** Maintaining chat history, orchestrating the AI call, and persisting data.
* **Implementation Detail:** The DO intercepts the proxied request. It retrieves the session's chat history from its localized persistent storage (`this.ctx.storage.get`). To prevent context-window overflow and manage token costs, it slices the history array (e.g., `history.slice(-5)`), appends the dynamic system prompt, and calls the AI service. Once the AI responds, it atomically pushes both the user and assistant messages to disk.

### 3. The Inference Layer (`src/services/AI.ts`)
* **Responsibilities:** Abstracting the Workers AI binding.
* **Implementation Detail:** Decouples the specific model ID (`llama-3.3-70b-instruct-fp8-fast`) and hyper-parameters (temperature, max tokens) from the core DO logic. This ensures that swapping to a different model in the future requires modifying only a single file.

### 4. Data vs. Logic Separation (`Prompts.ts` & `Resume.ts`)
* **Responsibilities:** Preventing "Prompt Bloat."
* **Implementation Detail:** Hardcoding massive strings is an engineering anti-pattern. `src/data/Resume.ts` acts as a static JSON database of the candidate's skills and constraints. `src/utils/Prompts.ts` acts as a template compiler, injecting the JSON data and the recruiter's physical location at runtime to generate a highly targeted, context-aware instruction set for Llama 3.3.

### 5. The Glassmorphism Frontend (`public/`)
* **Responsibilities:** User input, request formatting, and telemetry visualization.
* **Implementation Detail:** A vanilla HTML/JS approach to keep bundle sizes at zero. The `app.js` handles async fetching, DOM manipulation, and specifically extracts the custom HTTP headers sent by the edge worker to display the telemetry (e.g., `⚡ Served from: Lisbon, Portugal | Model: Llama-3.3`) in real-time under the chat bubbles.

---

## 🛠 Local Development & Setup

1. **Install Dependencies**
   ```bash
   npm install
    ```
2. **Sync Types**
Generate the TypeScript types for your configured Cloudflare bindings:

    ```bash
    npm run types 
    # or npx wrangler types
    ```
3. **Run the Local Dev Server**

    ```bash
    npm run dev
    ```
Open http://localhost:8787 in your browser.

4. **Deploy to Cloudflare**

    ```bash
    npm run deploy
    ```