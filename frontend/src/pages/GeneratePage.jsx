import { useState, useRef, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

const CHAR_COLORS = {
  narrator: "#888", male_hero: "#60a5fa",
  female_lead: "#f472b6", villain: "#f87171",
  old_man: "#fbbf24", child: "#34d399",
};
const MOOD_THEMES = {
  thriller:  { a: "#e63946", b: "#7b0d14", emoji: "🔪" },
  romance:   { a: "#ff6b9d", b: "#8b1a4a", emoji: "💕" },
  horror:    { a: "#9b2226", b: "#2d0a0a", emoji: "👻" },
  comedy:    { a: "#f4d35e", b: "#7a6200", emoji: "😂" },
  emotional: { a: "#48cae4", b: "#0a4a5e", emoji: "💧" },
  suspense:  { a: "#9b5de5", b: "#3a0a6e", emoji: "🕵️" },
};

const PROMPTS = [
  "Ek detective aur killer ka aakhri confrontation",
  "Bichde bhai 20 saal baad milte hain",
  "Doctor ko pata chalta hai patient villain hai",
  "Pehli baarish mein college canteen love story",
  "4 dost jungle trip pe jaate hain aur kuch ajeeb hota hai",
];

const cleanText  = (t) => t.replace(/\[.*?\]/g, "").trim();
const getEmotion = (t) => {
  const m = t.match(/\[([^\]]+)\]/);
  if (!m) return "default";
  const e = m[1].toLowerCase();
  const keys = ["whispering","angry","crying","scared","laughing","shocked","tense","nervous"];
  return keys.find(k => e.includes(k)) || "default";
};
const cc = (v) => CHAR_COLORS[v] || "#ccc";

// ── Animated Album Art ───────────────────────────────────────────────
const AlbumArt = ({ mood, title, isPlaying }) => {
  const t = MOOD_THEMES[mood] || MOOD_THEMES.thriller;
  return (
    <div style={{
      width: "260px", height: "260px", borderRadius: "20px",
      position: "relative", overflow: "hidden",
      boxShadow: `0 30px 80px ${t.a}50`,
      flexShrink: 0,
    }}>
      {/* Background gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 30% 30%, ${t.a}cc, ${t.b} 70%)`,
      }} />
      {/* Animated rings */}
      {isPlaying && [1,2,3].map(i => (
        <div key={i} style={{
          position: "absolute",
          inset: `${i * 15}%`,
          border: `1px solid ${t.a}${Math.round(40 - i * 10).toString(16)}`,
          borderRadius: "50%",
          animation: `ringPulse ${1.5 + i * 0.4}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
      {/* Emoji */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "72px",
        filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.5))",
        animation: isPlaying ? "floatEmoji 3s ease-in-out infinite" : "none",
      }}>
        {t.emoji}
      </div>
      {/* Vinyl shine */}
      <div style={{
        position: "absolute", top: "-30%", left: "-30%",
        width: "60%", height: "60%",
        background: "radial-gradient(circle, #ffffff18 0%, transparent 70%)",
        borderRadius: "50%",
      }} />
    </div>
  );
};

// ── Waveform visualizer (fake, CSS animated) ────────────────────────
const Waveform = ({ isPlaying, accent, progress }) => {
  const bars = 40;
  return (
    <div style={{
      position: "relative", height: "48px",
      display: "flex", alignItems: "center", gap: "2px",
      cursor: "pointer",
    }}>
      {Array.from({ length: bars }).map((_, i) => {
        const filled = (i / bars) * 100 < progress;
        const h = 6 + Math.sin(i * 0.6) * 10 + Math.sin(i * 1.2) * 8 + Math.random() * 0;
        return (
          <div key={i} style={{
            flex: 1, borderRadius: "2px",
            background: filled ? accent : "#ffffff18",
            height: `${isPlaying ? h + Math.sin(Date.now() * 0.01 + i) * 4 : h}px`,
            transition: "height 0.15s ease, background 0.3s ease",
            animation: isPlaying ? `waveBar ${0.6 + (i % 5) * 0.1}s ease-in-out infinite alternate` : "none",
            animationDelay: `${i * 0.02}s`,
          }} />
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
const GeneratePage = ({ user, onLogout }) => {
  // View: "input" | "player"
  const [view, setView]             = useState("input");

  const [prompt, setPrompt]         = useState("");
  const [storyData, setStoryData]   = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep]       = useState(0);

  const [isPlaying, setIsPlaying]   = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [loadingIdx, setLoadingIdx] = useState(-1);
  const [progress, setProgress]     = useState(0);
  const [audioCache, setAudioCache] = useState({});
  const [error, setError]           = useState("");
  const [showQueue, setShowQueue]   = useState(false);

  const cancelRef = useRef(false);
  const audioRef  = useRef(null);
  const segRefs   = useRef([]);

  const GEN_STEPS = [
    "Characters ban rahe hain...",
    "Dialogues likh raha hoon...",
    "Emotions add kar raha hoon...",
    "Story polish ho rahi hai...",
  ];

  useEffect(() => {
    if (!generating) return;
    setGenStep(0);
    const iv = setInterval(() => setGenStep(p => Math.min(p + 1, GEN_STEPS.length - 1)), 1200);
    return () => clearInterval(iv);
  }, [generating]);

  const token = localStorage.getItem("sf_token");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError("");
    setAudioCache({});
    setProgress(0);
    setCurrentIdx(-1);
    try {
      const res = await axios.post(
        `${API}/story/generate`,
        { prompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStoryData(res.data);
      setView("player"); // ← switch to player immediately
    } catch (err) {
      setError(err.response?.data?.message || "Story generate nahi hui");
    } finally {
      setGenerating(false);
    }
  };

  const fetchAudio = async (segment, idx) => {
    if (audioCache[idx]) return audioCache[idx];
    setLoadingIdx(idx);
    const emotion = getEmotion(segment.text);
    const res = await fetch(`${API}/story/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: segment.text, voice: segment.voice, emotion }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.message || "TTS failed");
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    setAudioCache(prev => ({ ...prev, [idx]: url }));
    setLoadingIdx(-1);
    return url;
  };

  const playBlob = (url) => new Promise((resolve) => {
    if (cancelRef.current) return resolve();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    const a = new Audio(url);
    audioRef.current = a;
    a.onended = resolve; a.onerror = resolve;
    a.play().catch(resolve);
  });

  const playStory = async (startIdx = 0) => {
    if (!storyData?.segments?.length) return;
    cancelRef.current = false;
    setIsPlaying(true); setError("");
    const segs = storyData.segments;
    try {
      for (let i = startIdx; i < segs.length; i++) {
        if (cancelRef.current) break;
        setCurrentIdx(i);
        setProgress(Math.round(((i + 1) / segs.length) * 100));
        segRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
        const url = await fetchAudio(segs[i], i);
        if (cancelRef.current) break;
        await playBlob(url);
        if (!cancelRef.current)
          await new Promise(r => setTimeout(r, segs[i].voice === "narrator" ? 450 : 160));
      }
    } catch (err) { setError(err.message); }
    if (!cancelRef.current) setCurrentIdx(-1);
    setLoadingIdx(-1); setIsPlaying(false);
  };

  const stopStory = () => {
    cancelRef.current = true;
    audioRef.current?.pause();
    setIsPlaying(false); setCurrentIdx(-1); setLoadingIdx(-1); setProgress(0);
  };

  const togglePlay = () => isPlaying ? stopStory() : playStory(currentIdx >= 0 ? currentIdx : 0);

  const mood  = storyData?.mood?.toLowerCase() || "thriller";
  const theme = MOOD_THEMES[mood] || MOOD_THEMES.thriller;
  const segs  = storyData?.segments || [];
  const currentSeg = segs[currentIdx] || segs[0];

  // ── INPUT VIEW ──────────────────────────────────────────────────────
  if (view === "input") {
    return (
      <div style={{
        minHeight: "100vh", background: "#080810", color: "#fff",
        fontFamily: "'Georgia', serif", display: "flex", flexDirection: "column",
      }}>
        {/* Nav */}
        <nav style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 40px", borderBottom: "1px solid #ffffff08",
          background: "#080810f0", backdropFilter: "blur(12px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>🎙</span>
            <span style={{ fontSize: "18px", fontWeight: "900", letterSpacing: "-0.5px" }}>StoryForge</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "13px", color: "#ffffff44" }}>Namaste, {user?.name?.split(" ")[0]} 👋</span>
            <button onClick={onLogout} style={{
              padding: "8px 18px", borderRadius: "20px",
              background: "transparent", border: "1px solid #ffffff15",
              color: "#ffffff44", fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
            }}>Logout</button>
          </div>
        </nav>

        {/* Main */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "40px 24px",
        }}>
          <div style={{ width: "100%", maxWidth: "600px" }}>

            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎭</div>
              <h1 style={{ fontSize: "36px", fontWeight: "900", margin: "0 0 10px", letterSpacing: "-1.5px" }}>
                Kahani Likho
              </h1>
              <p style={{ color: "#ffffff44", fontStyle: "italic", margin: 0, fontSize: "15px" }}>
                Ek idea — aur AI poori audio drama bana dega
              </p>
            </div>

            {/* Quick ideas */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#ffffff33", marginBottom: "10px" }}>
                QUICK IDEAS
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {PROMPTS.map((p, i) => (
                  <button key={i} onClick={() => setPrompt(p)} style={{
                    padding: "8px 14px", borderRadius: "20px", fontSize: "12px",
                    background: "#ffffff08", border: "1px solid #ffffff10",
                    color: "#ffffff55", cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#ffffff12"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#ffffff08"; e.currentTarget.style.color = "#ffffff55"; }}
                  >
                    {p.length > 36 ? p.slice(0, 36) + "…" : p}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && e.ctrlKey && handleGenerate()}
              placeholder="Apna story idea likho... (Ctrl+Enter se generate)"
              rows={5}
              style={{
                width: "100%", padding: "20px 22px",
                background: "#ffffff08", border: "1px solid #ffffff12",
                borderRadius: "16px", color: "#fff", fontSize: "16px",
                resize: "none", outline: "none", fontFamily: "inherit",
                lineHeight: "1.7", boxSizing: "border-box", marginBottom: "12px",
              }}
              onFocus={e => e.target.style.borderColor = "#ffffff30"}
              onBlur={e => e.target.style.borderColor = "#ffffff12"}
            />

            {error && (
              <div style={{
                padding: "12px 16px", borderRadius: "10px", marginBottom: "12px",
                background: "#e6394615", border: "1px solid #e6394633",
                fontSize: "13px", color: "#e63946",
              }}>⚠️ {error}</div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              style={{
                width: "100%", padding: "20px", borderRadius: "14px", border: "none",
                background: generating || !prompt.trim()
                  ? "#ffffff08"
                  : "linear-gradient(135deg, #e63946 0%, #9b5de5 100%)",
                color: generating || !prompt.trim() ? "#ffffff22" : "#fff",
                fontSize: "17px", fontWeight: "900", letterSpacing: "1px",
                cursor: generating || !prompt.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit", transition: "all 0.3s ease",
                boxShadow: generating || !prompt.trim() ? "none" : "0 8px 40px #e6394440",
              }}
            >
              {generating
                ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                    <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>✨</span>
                    {GEN_STEPS[genStep]}
                  </span>
                : "✨ Kahani Banao"}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        `}</style>
      </div>
    );
  }

  // ── PLAYER VIEW (YouTube Music / Spotify style) ─────────────────────
  return (
    <div style={{
      minHeight: "100vh", color: "#fff",
      fontFamily: "'Georgia', serif",
      position: "relative", overflow: "hidden",
      background: `radial-gradient(ellipse at 20% 0%, ${theme.a}30 0%, transparent 50%),
                   radial-gradient(ellipse at 80% 100%, ${theme.b}40 0%, transparent 50%),
                   #080810`,
      display: "flex", flexDirection: "column",
    }}>

      {/* ── Blurred background art ── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: `radial-gradient(ellipse at 50% 30%, ${theme.a}20, transparent 60%)`,
        pointerEvents: "none",
      }} />

      {/* ── Top Bar ── */}
      <nav style={{
        position: "relative", zIndex: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 28px",
      }}>
        <button
          onClick={() => { stopStory(); setView("input"); }}
          style={{
            background: "#ffffff12", border: "none",
            color: "#fff", width: "36px", height: "36px",
            borderRadius: "50%", cursor: "pointer", fontSize: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ‹
        </button>
        <div style={{ fontSize: "12px", letterSpacing: "3px", color: "#ffffff55", textTransform: "uppercase" }}>
          Now Playing
        </div>
        <button
          onClick={() => setShowQueue(q => !q)}
          style={{
            background: showQueue ? "#ffffff22" : "#ffffff12",
            border: "none", color: "#fff", width: "36px", height: "36px",
            borderRadius: "50%", cursor: "pointer", fontSize: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          title="Queue / Segments"
        >☰</button>
      </nav>

      {/* ── Main Layout ── */}
      <div style={{
        position: "relative", zIndex: 5,
        flex: 1, display: "flex",
        padding: "0 32px 32px",
        gap: "32px",
        overflow: "hidden",
      }}>

        {/* ── Left: Player ── */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          minWidth: 0,
        }}>

          {/* Album Art */}
          <AlbumArt mood={mood} title={storyData.title} isPlaying={isPlaying} />

          {/* Title & mood */}
          <div style={{ textAlign: "center", marginTop: "32px", width: "100%", maxWidth: "340px" }}>
            <div style={{
              fontSize: "10px", letterSpacing: "3px",
              color: theme.a, textTransform: "uppercase",
              marginBottom: "8px", transition: "color 0.5s",
            }}>
              {theme.emoji} {mood}
            </div>
            <h2 style={{
              fontSize: "clamp(22px, 4vw, 30px)", fontWeight: "900",
              margin: "0 0 8px", letterSpacing: "-0.5px", lineHeight: 1.2,
            }}>
              {storyData.title}
            </h2>
            {/* Characters */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "28px" }}>
              {storyData.characters?.filter(c => c.voice !== "narrator").map((c, i) => (
                <span key={i} style={{
                  fontSize: "12px", color: cc(c.voice), fontFamily: "monospace",
                }}>
                  {c.name}
                  {i < storyData.characters.filter(x => x.voice !== "narrator").length - 1 && (
                    <span style={{ color: "#ffffff22", margin: "0 6px" }}>·</span>
                  )}
                </span>
              ))}
            </div>

            {/* Now speaking */}
            {currentIdx >= 0 && (
              <div style={{
                padding: "10px 16px", borderRadius: "10px",
                background: `${theme.a}18`, border: `1px solid ${theme.a}33`,
                marginBottom: "20px", fontSize: "13px",
                color: "#ddd", lineHeight: "1.5",
                animation: "fadeIn 0.3s ease",
              }}>
                <div style={{ fontSize: "9px", letterSpacing: "2px", color: theme.a, marginBottom: "4px" }}>
                  {loadingIdx >= 0 ? "⏳ LOADING..." : "▶ AB BOL RAHE HAIN"}
                </div>
                <div style={{ fontStyle: currentSeg?.voice === "narrator" ? "italic" : "normal", color: "#aaa" }}>
                  {cleanText(currentSeg?.text || "").slice(0, 80)}{cleanText(currentSeg?.text || "").length > 80 ? "..." : ""}
                </div>
              </div>
            )}

            {/* Waveform / progress */}
            <div style={{ marginBottom: "8px" }}>
              <Waveform isPlaying={isPlaying} accent={theme.a} progress={progress} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#ffffff33", marginBottom: "24px" }}>
              <span>{currentIdx >= 0 ? `${currentIdx + 1}/${segs.length}` : "0"}</span>
              <span>{segs.length} segments</span>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px" }}>

              {/* Prev */}
              <button
                onClick={() => { stopStory(); setTimeout(() => playStory(Math.max(0, (currentIdx || 0) - 1)), 100); }}
                style={ctrlBtnStyle}
              >⏮</button>

              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                style={{
                  width: "68px", height: "68px", borderRadius: "50%", border: "none",
                  background: `linear-gradient(135deg, ${theme.a}, ${theme.b === "#2d0a0a" ? "#7b0d14" : theme.b})`,
                  color: "#fff", fontSize: "24px", cursor: "pointer",
                  boxShadow: `0 8px 32px ${theme.a}50`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "transform 0.15s ease",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                {isPlaying && loadingIdx < 0 ? "⏸" : loadingIdx >= 0 ? "⏳" : "▶"}
              </button>

              {/* Next */}
              <button
                onClick={() => { stopStory(); setTimeout(() => playStory(Math.min(segs.length - 1, (currentIdx || 0) + 1)), 100); }}
                style={ctrlBtnStyle}
              >⏭</button>
            </div>

            {error && (
              <div style={{
                marginTop: "16px", padding: "10px 14px", borderRadius: "10px",
                background: "#e6394615", border: "1px solid #e6394633",
                fontSize: "12px", color: "#e63946",
              }}>⚠️ {error}</div>
            )}
          </div>
        </div>

        {/* ── Right: Queue / Script ── */}
        {showQueue && (
          <div style={{
            width: "320px", flexShrink: 0,
            background: "#ffffff06", borderRadius: "20px",
            border: "1px solid #ffffff0a",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
            animation: "slideIn 0.25s ease",
          }}>
            <div style={{
              padding: "18px 20px", borderBottom: "1px solid #ffffff0a",
              fontSize: "11px", letterSpacing: "2px", color: "#ffffff44",
            }}>
              SCRIPT · {segs.length} SEGMENTS
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {segs.map((seg, idx) => {
                const isActive  = idx === currentIdx;
                const isLoading = idx === loadingIdx;
                const isNarr    = seg.voice === "narrator";
                const color     = cc(seg.voice);
                const cached    = !!audioCache[idx];

                return (
                  <div
                    key={idx}
                    ref={el => (segRefs.current[idx] = el)}
                    onClick={() => { stopStory(); setTimeout(() => playStory(idx), 100); }}
                    style={{
                      padding: "12px 14px", borderRadius: "10px",
                      marginBottom: "6px", cursor: "pointer",
                      background: isActive ? `${color}18` : "transparent",
                      borderLeft: `3px solid ${isActive ? color : isNarr ? "#ffffff15" : color + "55"}`,
                      transition: "all 0.2s",
                      opacity: isPlaying && !isActive && !isLoading ? 0.4 : 1,
                    }}
                    onMouseEnter={e => !isActive && (e.currentTarget.style.background = "#ffffff08")}
                    onMouseLeave={e => !isActive && (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{
                      fontSize: "9px", letterSpacing: "2px", fontFamily: "monospace",
                      color: isNarr ? "#555" : color,
                      marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px",
                    }}>
                      {isNarr ? "NARRATOR" : seg.speaker.toUpperCase()}
                      {cached && <span style={{ color: "#ffffff22" }}>✓</span>}
                      {isLoading && <span style={{ color: theme.a }}>⏳</span>}
                      {isActive && <span style={{ color: theme.a, animation: "pulse 1s infinite" }}>▶</span>}
                    </div>
                    <div style={{
                      fontSize: "12px", lineHeight: "1.6",
                      color: isNarr ? "#555" : "#ccc",
                      fontStyle: isNarr ? "italic" : "normal",
                    }}>
                      {cleanText(seg.text).slice(0, 80)}
                      {cleanText(seg.text).length > 80 ? "…" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ringPulse { from{transform:scale(0.95);opacity:0.3} to{transform:scale(1.05);opacity:0.7} }
        @keyframes floatEmoji { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes waveBar { from{opacity:0.6} to{opacity:1} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
};

const ctrlBtnStyle = {
  width: "44px", height: "44px", borderRadius: "50%", border: "none",
  background: "#ffffff12", color: "#fff",
  fontSize: "16px", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "background 0.2s",
};

export default GeneratePage;