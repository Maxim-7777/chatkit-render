import express from "express";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WORKFLOW_ID = process.env.CHATKIT_WORKFLOW_ID;

if (!OPENAI_API_KEY || !WORKFLOW_ID) {
  console.error("Missing env vars: OPENAI_API_KEY or CHATKIT_WORKFLOW_ID");
}

async function createSession(userId) {
  const resp = await fetch("https://api.openai.com/v1/chatkit/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "OpenAI-Beta": "chatkit_beta=v1",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      workflow: { id: WORKFLOW_ID },
      user: userId
    })
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`OpenAI error ${resp.status}: ${txt}`);
  }

  return await resp.json();
}

// Start Session
app.post("/api/chatkit/start", async (req, res) => {
  try {
    const userId = req.body?.userId || `web_${crypto.randomUUID()}`;
    const session = await createSession(userId);
    res.json({ client_secret: session.client_secret, userId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "session_start_failed" });
  }
});

// Refresh Session (für einfaches Setup erstellen wir einfach eine neue)
app.post("/api/chatkit/refresh", async (req, res) => {
  try {
    const userId = req.body?.userId || `web_${crypto.randomUUID()}`;
    const session = await createSession(userId);
    res.json({ client_secret: session.client_secret, userId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "session_refresh_failed" });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on ${port}`);
});
