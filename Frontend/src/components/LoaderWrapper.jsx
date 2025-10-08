import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PageLoader from "./PageLoader";

export default function LoaderWrapper({ children }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Simulate short delay for smoother transition
    const timer = setTimeout(() => setLoading(false), 600);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {loading && <PageLoader />}
      <div style={{ opacity: loading ? 0 : 1, transition: "opacity 0.3s ease" }}>
        {children}
      </div>
    </>
  );
}
