import React from "react";

export default function CatTrack({ progress }) {
  // Calculate cat position based on progress
  const catPosition = `${progress}%`;

  return (
    <div className="track">
      <img 
        src="/images/running_cat.gif" 
        className="cat" 
        alt="Running Cat"
        style={{ left: catPosition }}
      />
      <div className="finish-line">🏁</div>
    </div>
  );
}