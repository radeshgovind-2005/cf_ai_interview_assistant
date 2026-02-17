# AI Interview Assistant (Radesh.AI)

A serverless AI Agent built on **Cloudflare Workers**, **Hono**, and **Workers AI (Llama 3.3)**.
This project demonstrates a stateful conversation system where the AI adopts the persona of the candidate (Radesh) to answer recruiter questions based on his real profile.

## 🚀 Stack

* **Runtime:** Cloudflare Workers (0ms cold start)
* **Framework:** Hono (Lightweight edge router)
* **AI Model:** Llama 3.3 70B Instruct (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`)
* **Memory/State:** Cloudflare KV (Stores session history for context awareness)
* **Frontend:** HTML5/CSS3 (Hosted via Workers Assets)

## 🏗 Architecture

`Client (Browser)` <-> `Worker (Hono)` <-> `KV (Chat History)`
                                      ^
                                      |
                               `Workers AI (Inference)`

## 🛠 How to Run

### Prerequisites
* Node.js & npm
* Cloudflare Wrangler CLI (`npm install -g wrangler`)

### Local Development
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
3.  Open `http://localhost:8787` in your browser.

## 🧠 Features implemented
* **Contextual Awareness:** Uses RAG-Lite pattern (System Prompt + KV History) to maintain conversation context.
* **Persona Injection:** The AI is strictly instructed to represent the candidate's specific stack (Kotlin, Spring, Cloudflare).
* **State Management:** Chat history persists across messages using KV.