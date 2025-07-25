const express = require("express");
const router = express.Router();
// Use dynamic import for node-fetch in CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require("dotenv").config();

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Helper to call Gemini API
async function callGemini(messages, prompt) {
  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { text: messages.join("\n") }
        ]
      }
    ]
  };
  const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
}

// POST /api/gemini/recommend-reply
router.post("/recommend-reply", async (req, res) => {
  const { messages } = req.body;
  try {
    // Strict prompt: no intro, just 3 numbered replies
    const prompt = `Suggest exactly 3 concise, friendly replies to the last message in this chat. 
Reply ONLY with a numbered list, no introduction or explanation, like:
1. First reply
2. Second reply
3. Third reply`;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            { text: messages.join("\n") }
          ]
        }
      ],
      generationConfig: { candidateCount: 1 }
    };
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await geminiRes.json();

    // Strictly extract only lines starting with 1. 2. 3. and remove quotes
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let replies = [];
    for (const line of text.split('\n')) {
      const match = line.match(/^\s*\d+\.\s*(.*)$/);
      if (match && match[1]) {
        // Remove leading/trailing quotes and whitespace
        let reply = match[1].trim().replace(/^"+|"+$/g, "");
        if (reply) replies.push(reply);
      }
      if (replies.length === 3) break;
    }
    // Ensure exactly 3 replies
    while (replies.length < 3) replies.push("...");

    res.json({ replies });
  } catch (err) {
    console.error("Gemini recommend-reply error:", err);
    res.status(500).json({ replies: ["Gemini API error", "Gemini API error", "Gemini API error"] });
  }
});

// POST /api/gemini/summarize
router.post("/summarize", async (req, res) => {
  const { messages } = req.body;
  try {
    const prompt = "Summarize the following chat messages in 2-3 sentences:";
    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            { text: messages.join("\n") }
          ]
        }
      ]
    };
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await geminiRes.json();

    const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No summary generated.";
    res.json({ summary });
  } catch (err) {
    console.error("Gemini summarize error:", err);
    res.status(500).json({ summary: "Gemini API error" });
  }
});

module.exports = router;