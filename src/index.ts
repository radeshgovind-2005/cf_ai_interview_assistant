import { Hono } from "hono";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/message", (c) => {
  return c.text("Hello Hono!");
});

app.get("/ai-agent", async (c) => {
  const res = await c.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast",{
    messages: [
      {"role": "user", "content": "Say Hello world in the Portugues, Spanish, Russian, and Mandarim"}
    ]
  })
  return c.json(res)
});

export default app;
