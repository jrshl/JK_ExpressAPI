import React from 'react';

const FactDisplay = ({ fact, className = "" }) => {
  return (
    <p id="fact" className={`fact-display ${className}`}>
      {fact}
    </p>
  );
};

export default FactDisplay;