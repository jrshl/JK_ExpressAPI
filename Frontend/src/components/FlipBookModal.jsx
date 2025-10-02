
import React, { useRef } from "react";
import "./FlipBook.css";

export default function FlipBookModal({ encounteredFacts, onClose }) {
  const [current, setCurrent] = React.useState(0);
  const [flipping, setFlipping] = React.useState(false);
  const [selectedFact, setSelectedFact] = React.useState(null);
  const [showFactModal, setShowFactModal] = React.useState(false);
  const pageSize = 9; // 3x3 grid per page
  const totalPages = 13;
  const maxFacts = totalPages * pageSize * 2; // 234 total slots
  
  // Create ordered array where each fact is placed at its correct index
  const orderedFacts = Array.from({ length: maxFacts }, (_, i) => {
    const factIndex = i + 1; // Facts are 1-indexed
    return encounteredFacts[factIndex] || null;
  });
  
  const leftPageFacts = orderedFacts.slice(current * pageSize * 2, current * pageSize * 2 + pageSize);
  const rightPageFacts = orderedFacts.slice(current * pageSize * 2 + pageSize, current * pageSize * 2 + pageSize * 2);
  const flipDirection = useRef("next");

  // Handle card click to show fact
  const handleCardClick = (factIndex, fact) => {
    if (fact) {
      setSelectedFact({ index: factIndex, content: fact });
      setShowFactModal(true);
    }
  };

  // Animate flip on page change
  const handleFlip = (dir) => {
    if (flipping) return;
    flipDirection.current = dir;
    setFlipping(true);
    setTimeout(() => {
      setFlipping(false);
      setCurrent(c => dir === "next" ? Math.min(c + 1, totalPages - 1) : Math.max(c - 1, 0));
    }, 800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="flipbook-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn-top" onClick={onClose} disabled={flipping}>×</button>
        
        <div className={`flipbook-book-container flip-anim${flipping ? " flipping-" + flipDirection.current : ""}`}>
          {/* Left Navigation Arrow */}
          <button 
            className="nav-arrow left-arrow" 
            onClick={() => handleFlip("prev")} 
            disabled={current === 0 || flipping}
          >
            ◀
          </button>
          
          {/* Book */}
          <div className="flipbook-book-3d">
            {/* Stack of all pages behind current page */}
            <div className="page-stack">
              {Array.from({length: totalPages - current}, (_, i) => (
                <div key={`stack-${current + i}`} className="stacked-page" style={{zIndex: totalPages - current - i}}></div>
              ))}
            </div>
            
            {/* Left page (current spread) */}
            <div className="flipbook-page left-page current-spread">
              <h4 className="page-title">Cat Facts</h4>
              <div className="flipbook-book-grid">
                {leftPageFacts.map((fact, i) => {
                  const factIndex = current * pageSize * 2 + i + 1;
                  return (
                    <div 
                      key={`left-${factIndex}`} 
                      className={`flipbook-card${fact ? ' collected' : ' empty'}${fact ? ' clickable' : ''}`}
                      onClick={() => handleCardClick(factIndex, fact)}
                    >
                      {fact ? (
                        <div className="fact-content">
                          <div className="fact-title">Cat Fact</div>
                          <div className="fact-number">#{factIndex}</div>
                        </div>
                      ) : (
                        <div className="empty-content">
                          <span className="question-mark">?</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Right page (flippable) */}
            <div className="flipbook-page right-page current-spread flippable">
              <h4 className="page-title">Collection</h4>
              <div className="flipbook-book-grid">
                {rightPageFacts.map((fact, i) => {
                  const factIndex = current * pageSize * 2 + pageSize + i + 1;
                  return (
                    <div 
                      key={`right-${factIndex}`} 
                      className={`flipbook-card${fact ? ' collected' : ' empty'}${fact ? ' clickable' : ''}`}
                      onClick={() => handleCardClick(factIndex, fact)}
                    >
                      {fact ? (
                        <div className="fact-content">
                          <div className="fact-title">Cat Fact</div>
                          <div className="fact-number">#{factIndex}</div>
                        </div>
                      ) : (
                        <div className="empty-content">
                          <span className="question-mark">?</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Back of the page */}
              <div className="page-back">
                <h4 className="page-title">Next Page</h4>
                <div className="flipbook-book-grid">
                  {/* Show next page content on back */}
                  {current < totalPages - 1 && orderedFacts.slice((current + 1) * pageSize * 2, (current + 1) * pageSize * 2 + pageSize).map((fact, i) => {
                    const factIndex = (current + 1) * pageSize * 2 + i + 1;
                    return (
                      <div 
                        key={`back-${factIndex}`} 
                        className={`flipbook-card${fact ? ' collected' : ' empty'}${fact ? ' clickable' : ''}`}
                        onClick={() => handleCardClick(factIndex, fact)}
                      >
                        {fact ? (
                          <div className="fact-content">
                            <div className="fact-title">Cat Fact</div>
                            <div className="fact-number">#{factIndex}</div>
                          </div>
                        ) : (
                          <div className="empty-content">
                            <span className="question-mark">?</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Navigation Arrow */}
          <button 
            className="nav-arrow right-arrow" 
            onClick={() => handleFlip("next")} 
            disabled={current === totalPages - 1 || flipping}
          >
            ▶
          </button>
        </div>
        
        {/* Bottom Page Counter */}
        <div className="page-counter">
          <span className="counter-badge">{current + 1}/{totalPages}</span>
        </div>
      </div>
      
      {/* Fact Content Modal */}
      {showFactModal && selectedFact && (
        <div className="fact-modal-overlay" onClick={() => setShowFactModal(false)}>
          <div className="fact-modal" onClick={e => e.stopPropagation()}>
            <h3>Cat Fact #{selectedFact.index}</h3>
            <p className="fact-content-text">{selectedFact.content}</p>
            <button className="fact-modal-close" onClick={() => setShowFactModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
