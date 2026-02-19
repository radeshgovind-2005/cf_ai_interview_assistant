import { ChatMessage } from "../types/Chat";
import { Env } from "../types/Env";

// Assuming you have an Env interface defined in worker-configuration.d.ts
export async function getAIResponse(env: Env, messages: ChatMessage[]): Promise<string> {
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages,
        max_tokens: 512,
        temperature: 0.6
    });

    return response.response;
}