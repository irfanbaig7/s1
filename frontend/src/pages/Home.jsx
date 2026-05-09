import { useState } from "react";

import PromptBox from "../components/PromptBox";
import StoryPlayer from "../components/StoryPlayer";
import LoginBox from "../components/LoginBox";

const Home = () => {
  const [storyData, setStoryData] = useState(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "white",
        padding: "40px",
        fontFamily: "sans-serif",
      }}
    >
      <h1>StoryForge</h1>

      <LoginBox />

      <PromptBox setStoryData={setStoryData} />

      {storyData && (
        <StoryPlayer storyData={storyData} />
      )}
    </div>
  );
};

export default Home;