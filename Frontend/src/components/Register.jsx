import { useState } from "react";
import axios from "axios";
import "./Register.css";
import AuthLoader from "./AuthLoader";
import SuccessModal from "./SuccessModal";

export default function Register({ onRegister }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setMsg("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setMsg("");

    try {
      const res = await axios.post("http://localhost:3000/api/user/register", form, {
        withCredentials: true,
      });
      setIsLoading(false);
      setShowSuccess(true);
    } catch (err) {
      setIsLoading(false);
      setMsg(err.response?.data?.error || "Error registering");
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onRegister?.();
  };

  return (
    <>
      {isLoading && <AuthLoader message="Registering..." />}
      {showSuccess && (
        <SuccessModal 
          message="Successfully Registered!" 
          onClose={handleSuccessClose} 
        />
      )}
      
      <div className="form-container">
        <h2>Register</h2>
        <form className="register-form" onSubmit={submit}>
          <input
            type="text"
            placeholder="Username"
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
            disabled={isLoading}
          />
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>
        {msg && <p className="message">{msg}</p>}
      </div>
    </>
  );
}
