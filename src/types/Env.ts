
export interface Env {
    // This binds the Cloudflare AI service
    AI: any; 

    // This binds your Durable Object namespace
    CHAT_SESSION: DurableObjectNamespace; 
}