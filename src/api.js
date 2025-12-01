// API base URL - change this if deploying to production
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export async function generateResponse(mode, prompt, history = []) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode,
        prompt,
        history,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate response");
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function generateImage(prompt) {
  try {
    const response = await fetch(`${API_BASE_URL}/image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate image");
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
}
