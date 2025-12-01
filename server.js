import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Chat completion endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { mode, prompt, history = [] } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    let model = "gpt-4o-mini";
    let systemPrompt = "";
    let messages = [];

    switch (mode) {
      case "chat":
        model = "gpt-4o-mini";
        systemPrompt =
          "You are a helpful, friendly assistant. Keep your answers short and clear. Use well-formatted markdown.";
        messages = [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: prompt },
        ];
        break;

      case "creative":
        model = "gpt-4o";
        systemPrompt =
          "You are a creative writer. You write stories, poems, and long-form content. Use expressive tone, headings, dividers, and stylized markdown.";
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ];
        break;

      default:
        return res.status(400).json({ error: "Invalid mode selected" });
    }

    const completion = await client.chat.completions.create({
      model: model,
      messages: messages,
    });

    res.json({
      content: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({
      error: error.message || "An error occurred while processing your request",
    });
  }
});

// Image generation endpoint
app.post("/api/image", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await client.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    res.json({
      url: response.data[0].url,
    });
  } catch (error) {
    console.error("OpenAI Image Generation Error:", error);
    res.status(500).json({
      error: error.message || "An error occurred while generating the image",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});
