import groq from "../config/groq.js";

export const generateStory = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: "Prompt is required" });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `
You are a professional Hindi audio drama writer — like Kuku FM stories.
Write a SHORT but GRIPPING cinematic Hindi audio story (1.5–2 min listen).

STRICT RULES:
- Exactly 2–3 characters with distinct personalities
- Each character has a voice tag from: "narrator", "male_hero", "female_lead", "villain", "old_man", "child"
- Story MUST have: setup → tension → emotional peak → twist or resolution
- Use raw natural Hindi — "yaar", "bhai", "arre", "sun", "dekh", "chal"
- NO formal Hindi at all
- Dialogues: short, punchy, emotional
- Narrator sets the scene between dialogues (cinematic voiceover style)
- Add emotion cues inline: [whispering], [angry], [crying], [laughing], [shocked], [scared], [tense], [nervous]
- Write at least 12 segments for a full story feel

Return ONLY valid JSON — no extra text, no markdown backticks:

{
  "title": "Story title in Hindi or Hinglish",
  "mood": "thriller",
  "characters": [
    { "name": "Rohan", "voice": "male_hero", "trait": "brave but reckless" },
    { "name": "Priya", "voice": "female_lead", "trait": "calm and sharp" },
    { "name": "Narrator", "voice": "narrator", "trait": "cinematic voice" }
  ],
  "segments": [
    { "speaker": "Narrator", "voice": "narrator", "text": "Raat ke 2 baje the..." },
    { "speaker": "Rohan", "voice": "male_hero", "text": "[nervous] Priya... tu theek hai na?" },
    { "speaker": "Priya", "voice": "female_lead", "text": "[scared, whispering] Rohan mat aa." }
  ]
}

mood must be one of: thriller, romance, horror, comedy, emotional, suspense
USER STORY IDEA: ${prompt}
          `,
        },
      ],
      temperature: 0.85,
      max_tokens: 1500,
    });

    const rawText = completion.choices[0].message.content;
    const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedStory = JSON.parse(cleaned);
    parsedStory.story = parsedStory.segments.map((s) => `${s.speaker}: ${s.text}`).join("\n\n");

    res.status(200).json(parsedStory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── TTS Proxy — ElevenLabs key stays on server ──────────────────────
const ELEVENLABS_VOICES = {
  narrator:    "nPczCjzI2devNBz1zQrb",
  male_hero:   "TX3LPaxmHKxFdv7VOQHJ",
  female_lead: "EXAVITQu4vr4xnSDxMaL",
  villain:     "onwK4e9ZLuTAKqWW03F9",
  old_man:     "pqHfZKP75CvOlQylNhV4",
  child:       "z9fAnlkpzviPz146aGWa",
};

const EMOTION_SETTINGS = {
  default:    { stability: 0.55, similarity_boost: 0.75, style: 0.3 },
  whispering: { stability: 0.80, similarity_boost: 0.60, style: 0.1 },
  angry:      { stability: 0.25, similarity_boost: 0.85, style: 0.9 },
  crying:     { stability: 0.40, similarity_boost: 0.80, style: 0.7 },
  scared:     { stability: 0.35, similarity_boost: 0.80, style: 0.6 },
  laughing:   { stability: 0.30, similarity_boost: 0.75, style: 0.8 },
  shocked:    { stability: 0.30, similarity_boost: 0.80, style: 0.7 },
  tense:      { stability: 0.50, similarity_boost: 0.75, style: 0.5 },
  nervous:    { stability: 0.40, similarity_boost: 0.75, style: 0.6 },
};

export const generateTTS = async (req, res) => {
  try {
    const { text, voice, emotion } = req.body;
    if (!text || !voice) return res.status(400).json({ message: "text and voice required" });

    const voiceId  = ELEVENLABS_VOICES[voice] || ELEVENLABS_VOICES.narrator;
    const settings = EMOTION_SETTINGS[emotion] || EMOTION_SETTINGS.default;
    const cleanText = text.replace(/\[.*?\]/g, "").trim();

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability:         settings.stability,
            similarity_boost:  settings.similarity_boost,
            style:             settings.style,
            use_speaker_boost: true,
          },
          language_code: "hi",
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        message: err?.detail?.message || "ElevenLabs error",
      });
    }

    // Stream audio back to frontend
    const audioBuffer = await response.arrayBuffer();
    res.set("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};