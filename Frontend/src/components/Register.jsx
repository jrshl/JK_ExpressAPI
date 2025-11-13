import { useState } from "react";
import axios from "axios";
import "./Register.css";

export default function Register({ onRegister }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setMsg("Passwords do not match");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3000/api/user/register", form, {
        withCredentials: true,
      });
      setMsg("Registration successful!");
      onRegister?.(res.data.user);
    } catch (err) {
      setMsg(err.response?.data?.error || "Error registering");
    }
  };

  return (
    <div className="form-container">
      <h2>Register</h2>
      <form className="register-form" onSubmit={submit}>
        <input
          type="text"
          placeholder="Username"
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          required
        />
        <button type="submit" className="submit-btn">
          Register
        </button>
      </form>
      <p className="message">{msg}</p>
    </div>
  );
}
