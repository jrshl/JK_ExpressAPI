import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import axios from "axios";

export default function LogoutButton() {
  const { setUser } = useContext(UserContext);

  const logout = async () => {
    await axios.post('http://localhost:3000/api/user/logout', {}, { withCredentials: true });
    setUser(null);
  };

  return <button onClick={logout}>Logout</button>;
}
