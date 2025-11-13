import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // check session on load
  useEffect(() => {
    axios.get("/api/user/session")
      .then(res => {
        if (res.data.loggedIn) setUser(res.data.user);
      })
      .catch(() => setUser(null));
  }, []);

  const login = (userData) => setUser(userData);
  const logout = () => {
    axios.post("/api/user/logout")
      .then(() => setUser(null))
      .catch(() => setUser(null));
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};
