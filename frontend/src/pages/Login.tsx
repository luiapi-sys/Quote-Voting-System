import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../utils/axios";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("/auth/login", { username, password });
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch {
      setError("เข้าสู่ระบบไม่สำเร็จ");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="p-6 border rounded w-96 shadow">
        <h2 className="text-xl mb-4">🔐 เข้าสู่ระบบ</h2>
        <input
          className="w-full border p-2 mb-2"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="w-full border p-2 mb-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white w-full py-2 rounded"
          onClick={handleLogin}
        >
          เข้าสู่ระบบ
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <p className="mt-4 text-sm">
          ยังไม่มีบัญชี?{" "}
          <Link to="/register" className="text-blue-500">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  );
}
