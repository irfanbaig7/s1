import { useState, useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import GeneratePage from "./pages/GeneratePage";

const App = () => {
  const [page, setPage] = useState("landing"); // landing | auth | generate
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("sf_token");
    const userData = localStorage.getItem("sf_user");
    if (token && userData) {
      setUser(JSON.parse(userData));
      setPage("generate");
    }
  }, []);

  const handleAuth = (userData, token) => {
    localStorage.setItem("sf_token", token);
    localStorage.setItem("sf_user", JSON.stringify(userData));
    setUser(userData);
    setPage("generate");
  };

  const handleLogout = () => {
    localStorage.removeItem("sf_token");
    localStorage.removeItem("sf_user");
    setUser(null);
    setPage("landing");
  };

  if (page === "landing") return <LandingPage onGetStarted={() => setPage("auth")} />;
  if (page === "auth")    return <AuthPage onAuth={handleAuth} onBack={() => setPage("landing")} />;
  if (page === "generate") return <GeneratePage user={user} onLogout={handleLogout} />;
};

export default App;