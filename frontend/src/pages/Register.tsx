import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axios";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const res = await axios.post("/auth/register", { username, password });
      localStorage.setItem("token", res.data.accessToken);
      navigate("/");
    } catch {
      setError("สมัครสมาชิกไม่สำเร็จ");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="p-6 border rounded w-96 shadow">
        <h2 className="text-xl mb-4">📝 สมัครสมาชิก</h2>
        <input
          className="w-full border p-2 mb-2"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="w-full border p-2 mb-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border p-2 mb-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="bg-green-600 text-white w-full py-2 rounded"
          onClick={handleRegister}
        >
          สมัคร
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}
