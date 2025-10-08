import React, { useState } from "react";
import "./StackedCards.css";

export default function StackedCards({ cards, onClose, onStoreComplete }) {
  // compute id from fact text
  function generateFactId(fact) {
    let hash = 0;
    for (let i = 0; i < fact.length; i++) {
      const char = fact.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 234 + 1;
  }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStoring, setIsStoring] = useState(false);
  const [isBundling, setIsBundling] = useState(false);

  const handleClick = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (currentIndex === cards.length - 1 && !isBundling && !isStoring) {
      setIsBundling(true);
      
      // After bundling animation, start storing animation
      setTimeout(() => {
        setIsBundling(false);
        setIsStoring(true);
        
        // Close modal after storing animation completes
        setTimeout(() => {
          if (onStoreComplete) {
            try {
              const ids = cards.map(c => generateFactId(c.content));
              onStoreComplete(ids);
            } catch {
              // ignore
            }
          }
          if (onClose) {
            onClose();
          }
        }, 1200); 
      }, 800); 
    }
  };

  const handleOverlayClick = () => {
    if (isStoring && onClose) {
      onClose();
      return;
    }
    
    if (!isBundling && !isStoring) {
      handleClick();
    }
  };

  const getFontSize = (text) => {
    const length = text.length;
    if (length < 50) return "12px";
    if (length < 100) return "11px";
    if (length < 150) return "10px";  
    if (length < 200) return "9px";
    return "8px";
  };

  const renderCards = () => {
    return cards.map((card, i) => {
      let className = "card";
      if (i < currentIndex && !isBundling && !isStoring) className += " away";
      if (isBundling) className += " bundling";
      if (isStoring) className += " storing";
      
      // Only show 3 cards in stack - cards 4+ follow the 3rd card's position
      const stackPosition = Math.min(i - currentIndex, 2);
      const angle = stackPosition >= 0 ? -10 * stackPosition : 0;
      let style = {};
      
      if (isStoring || isBundling) {
        style = { zIndex: cards.length - i };
      } else if (i < currentIndex) {
        style = { 
          transform: "translate(-50%, -50%) translateY(-120vh) rotate(-48deg)", 
          zIndex: cards.length - i 
        };
      } else if (i === currentIndex) {
        style = { 
          transform: "translate(-50%, -50%) rotate(0deg)", 
          zIndex: cards.length - i 
        };
      } else if (i <= currentIndex + 2) {
        style = { 
          transform: `translate(-50%, -50%) rotate(${angle}deg)`, 
          zIndex: cards.length - i 
        };
      } else {
        style = { 
          transform: "translate(-50%, -50%) rotate(-20deg)", 
          zIndex: cards.length - i 
        };
      }
      
      const contentStyle = {
        fontSize: getFontSize(card.content)
      };
      
      return (
        <div key={i} className={className} style={style}>
          <div className="sub">{card.sub}</div>
          <div className="content" style={contentStyle}>{card.content}</div>
        </div>
      );
    });
  };

  const getInstructionText = () => {
    if (isBundling || isStoring) return "";
    return "CLICK ANYWHERE";
  };

  return (
    <div className="stack-modal-overlay" onClick={handleOverlayClick}>
      <div className="stack-area">
        {renderCards()}
        {getInstructionText() && (
          <div className="instruction-text">
            {getInstructionText()}
          </div>
        )}
      </div>
    </div>
  );
}