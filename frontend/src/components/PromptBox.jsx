import { useState } from "react";

import axios from "axios";

const PromptBox = ({ setStoryData }) => {
  const [prompt, setPrompt] = useState("");

  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:5000/api/story/generate",

        {
          prompt,
        },

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStoryData(response.data);

    } catch (error) {
      console.log(error);

      alert("Story generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        marginTop: "30px",
      }}
    >
      <textarea
        placeholder="Enter story idea..."
        value={prompt}
        onChange={(e) =>
          setPrompt(e.target.value)
        }
        rows={5}
        style={{
          padding: "20px",
          fontSize: "18px",
          borderRadius: "10px",
        }}
      />

      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          padding: "15px",
          fontSize: "18px",
          cursor: "pointer",
        }}
      >
        {loading
          ? "Generating..."
          : "Generate Story"}
      </button>
    </div>
  );
};

export default PromptBox;