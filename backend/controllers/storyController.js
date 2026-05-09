import groq from "../config/groq.js";
import Story from "../models/Story.js";

export const generateStory = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `
You are an emotional cinematic storyteller.

Generate a SHORT cinematic Hindi audio story.

RULES:
- Use VERY natural Hindi
- Local conversational language
- NO formal Hindi
- Use words like "yaar", "bhai", "arre", "suno"
- Add emotions, suspense, dialogues
- Characters should feel real
- Story around 1-2 mins

Return ONLY valid JSON, no extra text:

{
  "title": "",
  "mood": "",
  "characters": [{"name": "", "voice": ""}],
  "story": ""
}

USER PROMPT: ${prompt}
          `,
        },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    const rawText = completion.choices[0].message.content;

    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsedStory = JSON.parse(cleaned);

    res.status(200).json(parsedStory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};