import { useContext, useState } from "react";
import { UserContext } from "../context/UserContext";
import axios from "axios";

export default function LogoutButton() {
  const { setUser } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
    setIsLoading(true);
    
    try {
      await axios.post('http://localhost:3000/api/user/logout', {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout request error:', err);
    }

    localStorage.removeItem('user');

    setTimeout(() => {
      if (setUser) setUser(null);
      window.location.reload();
    }, 800);
  };

  return (
    <>    
      <button onClick={logout} disabled={isLoading} className="logout-btn">
        {isLoading ? "Logging out..." : "Logout"}
      </button>
    </>
  );
}
