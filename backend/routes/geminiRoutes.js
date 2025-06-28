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
  const { messages, n } = req.body;
  try {
    const prompt = "Suggest a concise, friendly reply to the last message in this chat:";
    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            { text: messages.join("\n") }
          ]
        }
      ],
      generationConfig: { candidateCount: n || 3 }
    };
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await geminiRes.json();

    // LOG THE FULL RESPONSE
    console.log("Gemini recommend-reply response:", JSON.stringify(data, null, 2));

    const replies = (data?.candidates || []).map(
      c => c?.content?.parts?.[0]?.text || ""
    ).filter(Boolean);
    res.json({ replies });
  } catch (err) {
    console.error("Gemini recommend-reply error:", err);
    res.status(500).json({ replies: ["Gemini API error"] });
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

    // LOG THE FULL RESPONSE
    console.log("Gemini summarize response:", JSON.stringify(data, null, 2));

    const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No summary generated.";
    res.json({ summary });
  } catch (err) {
    console.error("Gemini summarize error:", err);
    res.status(500).json({ summary: "Gemini API error" });
  }
});

module.exports = router;