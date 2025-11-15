import { useState } from "react";
import axios from "axios";
import "./Login.css";
import AuthLoader from "./AuthLoader";
import SuccessModal from "./SuccessModal";
import PageLoader from "./PageLoader";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPageLoader, setShowPageLoader] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg("");
    
    try {
      const res = await axios.post("http://localhost:3000/api/user/login", form, {
        withCredentials: true,
      });
      
      // Save full user object returned by backend to localStorage
      if (res.data && res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      // Store daily fact
      if (res.data.dailyFact) {
        localStorage.setItem('pendingDailyFact', JSON.stringify(res.data.dailyFact));
      }    
       
      setIsLoading(false);
      setShowSuccess(true);
    } catch (err) {
      setIsLoading(false);
      setMsg(err.response?.data?.error || "Login failed");
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setShowPageLoader(true);

    setTimeout(() => {
      onLogin?.(JSON.parse(localStorage.getItem('user')));
      window.location.reload();
    }, 1500);
  };


  return (
    <>
      {isLoading && <AuthLoader message="Logging in..." />}
      {showSuccess && (
        <SuccessModal 
          message="Login Successful!" 
          onClose={handleSuccessClose} 
        />
      )}
      {showPageLoader && <PageLoader />}
      
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
            disabled={isLoading}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            disabled={isLoading}
          />

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {msg && <p className="login-message">{msg}</p>}
      </div>
    </>
  );
}
