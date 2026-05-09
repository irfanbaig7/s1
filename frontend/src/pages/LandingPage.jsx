import { useEffect, useRef, useState } from "react";

const STORIES = [
  { title: "Andhere Ki Awaaz", mood: "horror",    desc: "Ek purani haveli, ek raat, aur ek awaaz jo sirf tumhe sunti hai..." },
  { title: "Dil Ka Dard",      mood: "emotional", desc: "Bichhde hue do log, ek station, aur waqt jo rok nahi sakte..." },
  { title: "Last Call",        mood: "thriller",  desc: "Phone ki ghanti baji. Doosri taraf maut thi..." },
  { title: "Pehli Baarish",    mood: "romance",   desc: "Woh mili thi ek baarish mein. Phir kabhi nahi aayi..." },
];

const MOOD_COLORS = {
  horror: "#9b2226", emotional: "#48cae4", thriller: "#e63946", romance: "#ff6b9d",
};

const LandingPage = ({ onGetStarted }) => {
  const [activeCard, setActiveCard] = useState(0);
  const [mousePos, setMousePos]     = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setActiveCard(p => (p + 1) % STORIES.length), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouse = (e) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width  - 0.5) * 30,
        y: ((e.clientY - rect.top)  / rect.height - 0.5) * 30,
      });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const story = STORIES[activeCard];
  const accent = MOOD_COLORS[story.mood];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080810",
      color: "#fff",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      overflow: "hidden",
      position: "relative",
    }}>

      {/* Animated background orbs */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        transition: "all 1.5s ease",
      }}>
        <div style={{
          position: "absolute", width: "600px", height: "600px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
          top: "10%", left: "60%",
          transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
          transition: "transform 0.3s ease, background 1.5s ease",
        }} />
        <div style={{
          position: "absolute", width: "400px", height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #9b5de518 0%, transparent 70%)",
          bottom: "20%", left: "10%",
          transform: `translate(${-mousePos.x * 0.5}px, ${-mousePos.y * 0.5}px)`,
          transition: "transform 0.5s ease",
        }} />
      </div>

      {/* Nav */}
      <nav style={{
        position: "relative", zIndex: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "28px 48px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: `linear-gradient(135deg, ${accent}, #9b5de5)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px",
            transition: "background 1.5s ease",
          }}>🎙</div>
          <span style={{ fontSize: "20px", fontWeight: "bold", letterSpacing: "1px" }}>
            StoryForge
          </span>
        </div>
        <button
          onClick={onGetStarted}
          style={{
            padding: "10px 24px", borderRadius: "24px",
            background: "transparent",
            border: `1px solid ${accent}66`,
            color: accent, fontSize: "14px", cursor: "pointer",
            letterSpacing: "1px", transition: "all 0.3s ease",
            fontFamily: "inherit",
          }}
          onMouseEnter={e => {
            e.target.style.background = `${accent}22`;
            e.target.style.borderColor = accent;
          }}
          onMouseLeave={e => {
            e.target.style.background = "transparent";
            e.target.style.borderColor = `${accent}66`;
          }}
        >
          Login
        </button>
      </nav>

      {/* Hero */}
      <div ref={heroRef} style={{
        position: "relative", zIndex: 5,
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", padding: "80px 24px 60px",
      }}>
        <div style={{
          fontSize: "11px", letterSpacing: "4px", color: accent,
          textTransform: "uppercase", marginBottom: "24px",
          transition: "color 1.5s ease",
        }}>
          AI · Hindi Audio Stories
        </div>

        <h1 style={{
          fontSize: "clamp(48px, 8vw, 96px)",
          fontWeight: "900", lineHeight: "1.05",
          margin: "0 0 24px",
          background: `linear-gradient(135deg, #ffffff 40%, ${accent}88)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          transition: "all 1.5s ease",
          letterSpacing: "-2px",
        }}>
          Kahaniyan<br />Suno. Jiyo.
        </h1>

        <p style={{
          fontSize: "18px", color: "#ffffff55", maxWidth: "480px",
          lineHeight: "1.7", margin: "0 0 48px",
          fontStyle: "italic",
        }}>
          AI se banao cinematic Hindi audio drama — multiple characters, 
          real emotions, Kuku FM jaisa feel.
        </p>

        <button
          onClick={onGetStarted}
          style={{
            padding: "18px 48px", borderRadius: "50px",
            background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
            border: "none", color: "#fff",
            fontSize: "16px", fontWeight: "bold",
            cursor: "pointer", letterSpacing: "2px",
            boxShadow: `0 8px 40px ${accent}44`,
            transition: "all 1.5s ease",
            fontFamily: "inherit",
            transform: "translateY(0)",
          }}
          onMouseEnter={e => e.target.style.transform = "translateY(-3px)"}
          onMouseLeave={e => e.target.style.transform = "translateY(0)"}
        >
          SHURU KARO — FREE HAI
        </button>

        {/* Stats */}
        <div style={{
          display: "flex", gap: "48px", marginTop: "64px",
          borderTop: "1px solid #ffffff0a", paddingTop: "40px",
        }}>
          {[
            { num: "AI", label: "Powered Stories" },
            { num: "6+", label: "Character Voices" },
            { num: "∞", label: "Unique Kahaniyaan" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px", fontWeight: "900", color: accent, transition: "color 1.5s ease" }}>{s.num}</div>
              <div style={{ fontSize: "12px", color: "#ffffff33", letterSpacing: "1px", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Story Cards Carousel */}
      <div style={{
        position: "relative", zIndex: 5,
        padding: "0 48px 80px",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div style={{
          fontSize: "11px", letterSpacing: "3px", color: "#ffffff33",
          textTransform: "uppercase", marginBottom: "32px",
        }}>
          Sample Stories
        </div>

        <div style={{
          width: "100%", maxWidth: "520px",
          padding: "32px", borderRadius: "20px",
          background: "#ffffff07",
          border: `1px solid ${accent}33`,
          boxShadow: `0 20px 60px ${accent}15`,
          transition: "all 1.5s ease",
          textAlign: "left",
        }}>
          <div style={{
            fontSize: "10px", letterSpacing: "3px",
            color: accent, textTransform: "uppercase", marginBottom: "12px",
            transition: "color 1.5s ease",
          }}>
            {story.mood}
          </div>
          <div style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "12px" }}>
            {story.title}
          </div>
          <div style={{ fontSize: "15px", color: "#ffffff66", lineHeight: "1.7", fontStyle: "italic" }}>
            {story.desc}
          </div>

          {/* Fake waveform */}
          <div style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "24px" }}>
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} style={{
                width: "3px",
                height: `${8 + Math.sin(i * 0.8 + activeCard) * 12 + Math.random() * 8}px`,
                background: accent,
                borderRadius: "2px",
                opacity: 0.6,
                transition: "height 0.5s ease, background 1.5s ease",
              }} />
            ))}
            <span style={{ marginLeft: "12px", fontSize: "12px", color: "#ffffff44" }}>1:47</span>
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
          {STORIES.map((_, i) => (
            <div key={i}
              onClick={() => setActiveCard(i)}
              style={{
                width: i === activeCard ? "24px" : "8px", height: "8px",
                borderRadius: "4px",
                background: i === activeCard ? accent : "#ffffff22",
                cursor: "pointer",
                transition: "all 0.4s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: "relative", zIndex: 5,
        textAlign: "center", padding: "24px",
        borderTop: "1px solid #ffffff08",
        fontSize: "12px", color: "#ffffff22",
      }}>
        Made with ❤️ · StoryForge © 2025
      </div>
    </div>
  );
};

export default LandingPage;