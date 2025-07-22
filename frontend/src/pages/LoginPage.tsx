import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual login logic with API call
    console.log("Logging in with:", { username, password });
    // On successful login, redirect to the main page
    alert("Login successful! (Placeholder)");
    navigate("/");
  };

  return (
    <div>
      <h1>Login to Quote-Voting-System</h1>
      <form
        onSubmit={handleLogin}
        style={{ maxWidth: "300px", margin: "auto" }}
      >
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;
