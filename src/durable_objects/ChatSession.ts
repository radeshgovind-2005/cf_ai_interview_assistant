import { DurableObject } from "cloudflare:workers";
import { generateSystemPrompt } from "../utils/Prompts";
import { getAIResponse } from "../services/AI";
import { ChatMessage, MessagePayload } from "../types/Chat";

export class ChatSession extends DurableObject {
    
    // 1. Controller / Router
    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === "/message" && request.method === "POST") {
            return this.handleIncomingMessage(request);
        }

        return new Response("Not Found", { status: 404 });
    }

    // 2. Core Business Logic
    private async handleIncomingMessage(request: Request): Promise<Response> {
        try {
            const { message, meta } = await request.json<MessagePayload>();
            const history = await this.getHistory();

            // Prepare context
            const systemPrompt = generateSystemPrompt(meta.city, meta.country);
            const messagesContext: ChatMessage[] = [
                { role: "system", content: systemPrompt },
                ...history.slice(-5),
                { role: "user", content: message }
            ];

            // Save user message early
            await this.appendHistory({ role: "user", content: message });

            // Run AI Inference
            const aiResponseText = await getAIResponse(this.env, messagesContext);

            // Save assistant message
            await this.appendHistory({ role: "assistant", content: aiResponseText });

            return new Response(JSON.stringify({ response: aiResponseText }), {
                headers: { "Content-Type": "application/json" }
            });

        } catch (err) {
            console.error("AI Inference Failed:", err);
            return new Response(JSON.stringify({ error: "Internal Server Error" }), { 
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
    }

    // 3. State Management Helpers
    private async getHistory(): Promise<ChatMessage[]> {
        return (await this.ctx.storage.get<ChatMessage[]>("history")) || [];
    }

    private async appendHistory(newMessage: ChatMessage): Promise<void> {
        const history = await this.getHistory();
        history.push(newMessage);
        await this.ctx.storage.put("history", history);
    }
}