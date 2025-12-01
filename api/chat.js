import OpenAI from "openai";

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
}
