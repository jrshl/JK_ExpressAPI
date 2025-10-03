import React, { useState } from "react";
import "./StackedCards.css";

export default function StackedCards({ cards, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStoring, setIsStoring] = useState(false);
  const [isBundling, setIsBundling] = useState(false);

  const handleClick = () => {
    if (currentIndex < cards.length - 1) {
      // Still have cards to read
      setCurrentIndex(currentIndex + 1);
    } else if (currentIndex === cards.length - 1 && !isBundling && !isStoring) {
      // Just finished reading the last card, now start bundling
      setIsBundling(true);
      
      // After bundling animation, start storing animation
      setTimeout(() => {
        setIsBundling(false);
        setIsStoring(true);
        
        // Close modal after storing animation completes
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 1200); // Wait for storing animation to complete
      }, 800); // Wait for bundling animation to complete
    }
  };

  const handleOverlayClick = () => {
    // If we're storing, allow closing
    if (isStoring && onClose) {
      onClose();
      return;
    }
    
    // Otherwise, handle the card progression (anywhere on screen)
    if (!isBundling && !isStoring) {
      handleClick();
    }
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
        // Let CSS handle the bundling/storing animation
        style = { zIndex: cards.length - i };
      } else if (i < currentIndex) {
        // Card has been read - animate away
        style = { 
          transform: "translate(-50%, -50%) translateY(-120vh) rotate(-48deg)", 
          zIndex: cards.length - i 
        };
      } else if (i === currentIndex) {
        // This is the current card being read - make it straight
        style = { 
          transform: "translate(-50%, -50%) rotate(0deg)", 
          zIndex: cards.length - i 
        };
      } else if (i <= currentIndex + 2) {
        // Cards in visible stack (max 3 cards)
        style = { 
          transform: `translate(-50%, -50%) rotate(${angle}deg)`, 
          zIndex: cards.length - i 
        };
      } else {
        // Cards 4+ follow the 3rd card's position (hidden behind)
        style = { 
          transform: "translate(-50%, -50%) rotate(-20deg)", 
          zIndex: cards.length - i 
        };
      }
      
      return (
        <div key={i} className={className} style={style}>
          <div className="sub">{card.sub}</div>
          <div className="content">{card.content}</div>
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