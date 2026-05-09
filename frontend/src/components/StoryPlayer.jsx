import { useState, useRef } from "react";

// ─── ElevenLabs Hindi-friendly Voice IDs (free tier voices) ──────────
// These are pre-built voices available on free tier — no cloning needed
const ELEVENLABS_VOICES = {
  narrator:    { id: "nPczCjzI2devNBz1zQrb", name: "Brian"   }, // deep, calm
  male_hero:   { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam"    }, // young male
  female_lead: { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah"   }, // expressive female
  villain:     { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel"  }, // deep villain
  old_man:     { id: "pqHfZKP75CvOlQylNhV4", name: "Bill"    }, // older voice
  child:       { id: "z9fAnlkpzviPz146aGWa", name: "Glinda"  }, // lighter voice
};

// Emotion → ElevenLabs stability/similarity settings
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

const cleanText  = (t) => t.replace(/\[.*?\]/g, "").trim();
const getEmotion = (t) => {
  const m = t.match(/\[([^\]]+)\]/);
  if (!m) return "default";
  const e = m[1].toLowerCase();
  return Object.keys(EMOTION_SETTINGS).find(k => e.includes(k)) || "default";
};

const MOOD_THEMES = {
  thriller:  { bg: "#0d0d1a", accent: "#e63946", glow: "#e6394620" },
  romance:   { bg: "#1a0d12", accent: "#ff6b9d", glow: "#ff6b9d20" },
  horror:    { bg: "#070707", accent: "#9b2226", glow: "#9b222620" },
  comedy:    { bg: "#0d1a0d", accent: "#f4d35e", glow: "#f4d35e20" },
  emotional: { bg: "#0a0d1a", accent: "#48cae4", glow: "#48cae420" },
  suspense:  { bg: "#0d0a1a", accent: "#9b5de5", glow: "#9b5de520" },
};
const MOOD_EMOJI = {
  thriller:"🔪", romance:"💕", horror:"👻",
  comedy:"😂", emotional:"💧", suspense:"🕵️",
};
const CHAR_COLORS = {
  narrator:    "#888888",
  male_hero:   "#60a5fa",
  female_lead: "#f472b6",
  villain:     "#f87171",
  old_man:     "#fbbf24",
  child:       "#34d399",
};

const StoryPlayer = ({ storyData }) => {
  const [apiKey, setApiKey]           = useState(
    () => localStorage.getItem("el_api_key") || ""
  );
  const [showKey, setShowKey]         = useState(false);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [currentIdx, setCurrentIdx]   = useState(-1);
  const [progress, setProgress]       = useState(0);
  const [loadingIdx, setLoadingIdx]   = useState(-1); // which segment is fetching
  const [audioCache, setAudioCache]   = useState({}); // cache: segIdx → blob URL
  const [error, setError]             = useState("");
  const [charCount, setCharCount]     = useState(0);

  const cancelRef  = useRef(false);
  const audioRef   = useRef(null);
  const segRefs    = useRef([]);

  const segments = storyData?.segments || [];
  const mood     = storyData?.mood?.toLowerCase() || "thriller";
  const theme    = MOOD_THEMES[mood] || MOOD_THEMES.thriller;

  const saveKey = (k) => {
    setApiKey(k);
    localStorage.setItem("el_api_key", k);
  };

  // ── Fetch audio for one segment from ElevenLabs ──
  const fetchAudio = async (segment, idx) => {
    if (audioCache[idx]) return audioCache[idx]; // already cached

    const voiceConfig = ELEVENLABS_VOICES[segment.voice] || ELEVENLABS_VOICES.narrator;
    const emotion     = getEmotion(segment.text);
    const settings    = EMOTION_SETTINGS[emotion] || EMOTION_SETTINGS.default;
    const text        = cleanText(segment.text);

    setLoadingIdx(idx);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.id}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2", // supports Hindi
          voice_settings: {
            stability:        settings.stability,
            similarity_boost: settings.similarity_boost,
            style:            settings.style,
            use_speaker_boost: true,
          },
          language_code: "hi", // force Hindi pronunciation
        }),
      }
    );

    if (response.status === 401) throw new Error("API key galat hai ya expire ho gayi");
    if (response.status === 429) throw new Error("Rate limit — thoda ruko phir try karo");
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.detail?.message || `Error ${response.status}`);
    }

    const blob   = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    setAudioCache(prev => ({ ...prev, [idx]: blobUrl }));
    setCharCount(prev => prev + text.length);
    setLoadingIdx(-1);
    return blobUrl;
  };

  // ── Play one audio blob ──
  const playBlob = (blobUrl) => {
    return new Promise((resolve) => {
      if (cancelRef.current) return resolve();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      audio.onended  = resolve;
      audio.onerror  = resolve;
      audio.play().catch(resolve);
    });
  };

  // ── Play all segments ──
  const playStory = async (startIdx = 0) => {
    if (!apiKey.trim()) {
      setError("Pehle ElevenLabs API key daalo neeche");
      return;
    }
    setError("");
    cancelRef.current = false;
    setIsPlaying(true);
    setProgress(0);

    try {
      for (let i = startIdx; i < segments.length; i++) {
        if (cancelRef.current) break;
        setCurrentIdx(i);
        setProgress(Math.round(((i + 1) / segments.length) * 100));
        if (segRefs.current[i]) {
          segRefs.current[i].scrollIntoView({ behavior: "smooth", block: "center" });
        }
        const blobUrl = await fetchAudio(segments[i], i);
        if (cancelRef.current) break;
        await playBlob(blobUrl);
        // Pause between segments for drama
        if (!cancelRef.current) {
          await new Promise(r => setTimeout(r, segments[i].voice === "narrator" ? 500 : 200));
        }
      }
    } catch (err) {
      setError(err.message);
    }

    if (!cancelRef.current) setCurrentIdx(-1);
    setLoadingIdx(-1);
    setIsPlaying(false);
  };

  const stopStory = () => {
    cancelRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setIsPlaying(false);
    setCurrentIdx(-1);
    setLoadingIdx(-1);
    setProgress(0);
  };

  const totalCharsEstimate = segments
    .map(s => cleanText(s.text).length)
    .reduce((a, b) => a + b, 0);

  const cc = (voice) => CHAR_COLORS[voice] || "#cccccc";

  return (
    <div style={{
      marginTop: "40px",
      background: theme.bg,
      borderRadius: "16px",
      overflow: "hidden",
      border: `1px solid ${theme.accent}33`,
      boxShadow: `0 0 50px ${theme.glow}`,
      fontFamily: "'Georgia', serif",
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: "28px 32px 20px",
        borderBottom: `1px solid ${theme.accent}22`,
        background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent}10)`,
      }}>
        <div style={{ fontSize: "12px", color: theme.accent, letterSpacing: "3px", textTransform: "uppercase", marginBottom: "8px" }}>
          {MOOD_EMOJI[mood] || "🎙"} {mood} · elevenlabs ai voices
        </div>
        <h2 style={{ margin: "0 0 14px", fontSize: "24px", color: "#fff", lineHeight: 1.3 }}>
          {storyData.title}
        </h2>

        {/* Character tags */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {storyData.characters?.map((c, i) => (
            <div key={i} style={{
              padding: "4px 12px", borderRadius: "20px", fontSize: "11px",
              fontFamily: "monospace",
              border: `1px solid ${cc(c.voice)}44`,
              color: cc(c.voice),
              background: `${cc(c.voice)}12`,
            }}>
              {c.name}
              <span style={{ opacity: 0.5, marginLeft: "6px" }}>
                {ELEVENLABS_VOICES[c.voice]?.name || c.voice}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── API Key Section ── */}
      <div style={{
        padding: "16px 32px",
        background: "#ffffff06",
        borderBottom: `1px solid #ffffff0a`,
      }}>
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px", letterSpacing: "1px" }}>
          ELEVENLABS API KEY
          <span style={{ marginLeft: "10px", color: "#444", fontFamily: "sans-serif" }}>
            elevenlabs.io → Login → My Account → API Keys
          </span>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type={showKey ? "text" : "password"}
            placeholder="sk-..."
            value={apiKey}
            onChange={e => saveKey(e.target.value)}
            style={{
              flex: 1, padding: "10px 14px",
              background: "#ffffff0a", border: `1px solid ${apiKey ? theme.accent + "44" : "#ffffff18"}`,
              borderRadius: "8px", color: "#ddd", fontSize: "13px",
              fontFamily: "monospace", outline: "none",
            }}
          />
          <button
            onClick={() => setShowKey(s => !s)}
            style={{
              padding: "10px 14px", background: "#ffffff0a",
              border: "1px solid #ffffff18", borderRadius: "8px",
              color: "#888", fontSize: "12px", cursor: "pointer",
            }}
          >
            {showKey ? "🙈 hide" : "👁 show"}
          </button>
        </div>

        {/* Char count info */}
        <div style={{ marginTop: "8px", fontSize: "11px", color: "#555", fontFamily: "sans-serif" }}>
          Is story mein ~{totalCharsEstimate} characters hain &nbsp;·&nbsp;
          Free limit: 10,000 chars/month &nbsp;·&nbsp;
          Abhi tak use: {charCount} chars
        </div>

        {error && (
          <div style={{
            marginTop: "10px", padding: "10px 14px",
            background: "#e6394615", border: "1px solid #e6394633",
            borderRadius: "8px", fontSize: "13px", color: "#e63946",
            fontFamily: "sans-serif",
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div style={{ height: "2px", background: "#ffffff08" }}>
        <div style={{
          height: "100%", width: `${progress}%`,
          background: theme.accent, transition: "width 0.3s ease",
        }} />
      </div>

      {/* ── Segments ── */}
      <div style={{ padding: "24px 32px", maxHeight: "420px", overflowY: "auto" }}>
        {segments.map((seg, idx) => {
          const isActive   = idx === currentIdx;
          const isLoading  = idx === loadingIdx;
          const isNarr     = seg.voice === "narrator";
          const emotion    = getEmotion(seg.text);
          const color      = cc(seg.voice);

          return (
            <div
              key={idx}
              ref={el => (segRefs.current[idx] = el)}
              onClick={() => { stopStory(); setTimeout(() => playStory(idx), 100); }}
              style={{
                marginBottom: "20px", padding: "14px 18px",
                borderRadius: "10px", cursor: "pointer",
                transition: "all 0.2s ease",
                background: isActive ? `${color}15` : "transparent",
                borderLeft: isNarr ? `3px solid ${theme.accent}44` : `3px solid ${color}`,
                opacity: (isPlaying && !isActive && !isLoading) ? 0.4 : 1,
                transform: isActive ? "scale(1.005)" : "scale(1)",
              }}
            >
              {!isNarr && (
                <div style={{
                  fontSize: "10px", letterSpacing: "2px", fontFamily: "monospace",
                  color, marginBottom: "5px", textTransform: "uppercase",
                  display: "flex", alignItems: "center", gap: "8px",
                }}>
                  {seg.speaker}
                  {emotion !== "default" && (
                    <span style={{ color: "#ffffff33", fontSize: "9px" }}>[{emotion}]</span>
                  )}
                  {isLoading && (
                    <span style={{ color: theme.accent, animation: "pulse 0.8s infinite" }}>
                      ⏳ generating...
                    </span>
                  )}
                  {isActive && !isLoading && (
                    <span style={{ color: theme.accent, animation: "pulse 1s infinite" }}>▶ playing</span>
                  )}
                </div>
              )}

              {isNarr && isActive && (
                <div style={{ fontSize: "10px", color: theme.accent, marginBottom: "4px", animation: "pulse 1s infinite" }}>
                  ▶ narrator
                </div>
              )}

              <div style={{
                fontSize: isNarr ? "14px" : "16px",
                color: isNarr ? "#777" : "#efefef",
                lineHeight: "1.75",
                fontStyle: isNarr ? "italic" : "normal",
              }}>
                {cleanText(seg.text)}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Controls ── */}
      <div style={{
        padding: "20px 32px",
        borderTop: `1px solid ${theme.accent}18`,
        display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap",
      }}>
        <button
          onClick={isPlaying ? stopStory : () => playStory(0)}
          style={{
            padding: "12px 28px", borderRadius: "30px", border: "none",
            background: isPlaying
              ? "#ffffff15"
              : `linear-gradient(135deg, ${theme.accent}cc, ${theme.accent}88)`,
            color: "#fff", fontSize: "15px", fontWeight: "bold",
            cursor: "pointer", letterSpacing: "1px",
            boxShadow: isPlaying ? "none" : `0 4px 20px ${theme.glow}`,
            transition: "all 0.2s ease",
          }}
        >
          {isPlaying
            ? (loadingIdx >= 0 ? "⏳ Load ho raha hai..." : "■ Rokein")
            : "▶ Sunna Shuru Karein"}
        </button>

        {isPlaying && currentIdx >= 0 && (
          <div style={{ fontSize: "12px", color: "#ffffff44", fontFamily: "sans-serif" }}>
            {currentIdx + 1} / {segments.length}
          </div>
        )}

        {!isPlaying && progress === 100 && (
          <div style={{ fontSize: "13px", color: theme.accent }}>✓ Story khatam</div>
        )}

        <div style={{
          marginLeft: "auto", fontSize: "11px", color: "#333",
          fontFamily: "sans-serif",
        }}>
          💡 Kisi bhi line pe click karo — wahan se start hoga
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
};

export default StoryPlayer;