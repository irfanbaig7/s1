const StoryPlayer = ({ storyData }) => {

  const playStory = () => {

    const utterance =
      new SpeechSynthesisUtterance(
        storyData.story
      );

    const voices =
      speechSynthesis.getVoices();

    const hindiVoice = voices.find(
      (voice) =>
        voice.lang.includes("hi") ||
        voice.name.includes("India")
    );

    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    utterance.lang = "hi-IN";

    utterance.rate = 0.85;

    utterance.pitch = 0.95;

    speechSynthesis.speak(utterance);
  };

  const stopStory = () => {
    speechSynthesis.cancel();
  };

  return (
    <div
      style={{
        marginTop: "40px",
        padding: "20px",
        background: "#222",
        borderRadius: "10px",
      }}
    >
      <h2>{storyData.title}</h2>

      <p>
        Mood: {storyData.mood}
      </p>

      <div
        style={{
          marginTop: "20px",
          lineHeight: "1.8",
        }}
      >
        {storyData.story}
      </div>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        <button
          onClick={playStory}
          style={{
            padding: "12px 20px",
            cursor: "pointer",
          }}
        >
          ▶ Play
        </button>

        <button
          onClick={stopStory}
          style={{
            padding: "12px 20px",
            cursor: "pointer",
          }}
        >
          ■ Stop
        </button>
      </div>
    </div>
  );
};

export default StoryPlayer;