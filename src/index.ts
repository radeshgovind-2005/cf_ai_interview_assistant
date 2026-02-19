import { Hono } from "hono"
import { cors } from 'hono/cors'
import { Env } from "./types/Env"
import { MessagePayload } from "./types/Chat"

// 1. Use your centralized Env type
const app = new Hono<{ Bindings: Env }>()

app.use('/*', cors())

app.post('/api/chat', async (c) => {
  try {
    const { message, sessionId } = await c.req.json()
    
    if (!message || !sessionId) {
      return c.json({ error: "Message and sessionId are required" }, 400)
    }

    // 2. Extract location data from Cloudflare's request object (needed by your DO)
    const city = (c.req.raw.cf?.city as string) || "Unknown City"
    const country = (c.req.raw.cf?.country as string) || "Unknown Country"

    const payload: MessagePayload = {
        message,
        meta: { city, country }
    }

    // 3. Routing: Find the correct Durable Object instance for this session
    const id = c.env.CHAT_SESSION.idFromName(sessionId)
    const stub = c.env.CHAT_SESSION.get(id)

    // 4. Forward the request to the Durable Object
    // create a new Request targeting the DO's internal "/message" route
    const doRequest = new Request("https://do/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })

    const doResponse = await stub.fetch(doRequest)
    
    // 5. Pass the DO's response back to the client
    if (!doResponse.ok) {
        console.error("Durable Object returned status:", doResponse.status)
        // Cast doResponse.status to 'any' to satisfy Hono's strict status code typing
        return c.json(
            { error: "Failed to process chat" }, 
            doResponse.status as any
        )
    }

    const data = await doResponse.json()
    return c.json(data)

  } catch (error) {
    console.error("API Gateway Error:", error)
    return c.json({ error: "Internal Server Error" }, 500)
  }
})

export default app

// MUST export the Durable Object class from your main entrypoint file 
// so the Cloudflare runtime can find and instantiate it.
export { ChatSession } from "./durable_objects/ChatSession"