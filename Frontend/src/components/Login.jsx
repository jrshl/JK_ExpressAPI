import { useState } from "react";
import axios from "axios";
import "./Login.css";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post("http://localhost:3000/api/user/login", form, {
      withCredentials: true,
    });
    setMsg("Login successful!");
    // Save full user object returned by backend to localStorage
    if (res.data && res.data.user) {
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    onLogin?.(res.data.user);

    // show welcome modal (we'll implement showModal in App or a context)
    if (window.showWelcomeModal) {
      window.showWelcomeModal(`Welcome back, ${res.data.user.username}!`);
    }
  } catch (err) {
    setMsg(err.response?.data?.error || "Login failed");
  }
};


  return (
    <div className="login-wrapper">
      <h2>Login</h2>
      <form className="login-form" onSubmit={submit}>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          placeholder="Enter your username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button type="submit" className="login-btn">
          Login
        </button>
      </form>

      {msg && <p className="login-message">{msg}</p>}
    </div>
  );
}
