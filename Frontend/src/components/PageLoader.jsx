import React from "react";
import "./PageLoader.css";

export default function PageLoader() {
  return (
    <div className="page-loader">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
}
