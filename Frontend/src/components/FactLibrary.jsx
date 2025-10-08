import React, { useEffect, useMemo, useRef, useState } from 'react';
import './FactLibrary.css';

export default function FactLibrary({ encounteredFacts = {}, libraryNewIds = [], onClose, onMarkViewed, maxPages = 20 }) {
  // unique id suffix so multiple instances won't clash with identical IDs
  const uidRef = useRef(Math.random().toString(36).slice(2, 9));
  const uid = uidRef.current;

  const pagesCount = Math.max(1, Number(maxPages) || 20);

  // normalize encounteredFacts (accepts array or object keyed by 1..n)
  const facts = useMemo(() => {
    const out = [];
    for (let i = 0; i < pagesCount; i++) {
      let v;
      if (Array.isArray(encounteredFacts)) v = encounteredFacts[i];
      else v = encounteredFacts[i + 1];
      out.push(v ?? `Cat Fact placeholder ${i + 1}`);
    }
    return out;
  }, [encounteredFacts, pagesCount]);

  const [coverChecked, setCoverChecked] = useState(false);
  const [pageChecks, setPageChecks] = useState(() => Array(pagesCount).fill(false));
  const [unflipping, setUnflipping] = useState(() => Array(pagesCount).fill(false));
  const [isClosing, setIsClosing] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [isOpening, setIsOpening] = useState(true);
  const [pageSelectedFacts, setPageSelectedFacts] = useState({}); // track one selected fact per page: {pageIndex: factNumber}

  // Mark facts as viewed when they are displayed on the back page
  useEffect(() => {
    Object.values(pageSelectedFacts).forEach(factNumber => {
      if (factNumber && libraryNewIds.includes(factNumber) && onMarkViewed) {
        setTimeout(() => onMarkViewed(factNumber), 800);
      }
    });
  }, [pageSelectedFacts, libraryNewIds, onMarkViewed]);

  useEffect(() => {
    setPageChecks(prev => {
      const next = Array(pagesCount).fill(false);
      for (let i = 0; i < Math.min(prev.length, pagesCount); i++) next[i] = prev[i];
      return next;
    });
    setUnflipping(() => Array(pagesCount).fill(false));
  }, [pagesCount]);

  useEffect(() => {
    let tCoverStart, tFlip, tEnd;
    if (isOpening) {
      const openingDelay = 300; 
      const coverMs = 300; 
      const flipMs = 500;  
      const visibleBuffer = 50; 

      tCoverStart = setTimeout(() => {
        setCoverChecked(true);
      }, openingDelay);

      tFlip = setTimeout(() => {
        setPageChecks(prev => {
          if (prev[0]) return prev;
          const copy = [...prev];
          copy[0] = true;
          return copy;
        });

        tEnd = setTimeout(() => setIsOpening(false), flipMs);
      }, openingDelay + coverMs + visibleBuffer);
    }
    return () => {
      if (tCoverStart) clearTimeout(tCoverStart);
      if (tFlip) clearTimeout(tFlip);
      if (tEnd) clearTimeout(tEnd);
    };
  }, [isOpening]);

  const handleCloseAnimated = async () => {
    if (isClosing) return;
    setIsClosing(true);
    try {
      const flipMs = 50;
      const coverMs = 300;
      const fadeMs = 300;
      const flippedIndices = pageChecks
        .map((v, i) => (v ? i : -1))
        .filter(i => i !== -1)
        .reverse();
      
      // if user is beyond page 7, only show 5 pages closing
      const shouldOptimize = flippedIndices.length > 7;
      const pagesToAnimate = shouldOptimize ? flippedIndices.slice(0, 5) : flippedIndices;
      
      for (const idx of pagesToAnimate) {
        setUnflipping(prev => {
          const copy = [...prev];
          copy[idx] = true;
          return copy;
        });
        await new Promise(res => setTimeout(res, flipMs));
          setPageChecks(prev => {
            const copy = [...prev];
            copy[idx] = false;
            return copy;
        });
          setUnflipping(prev => {
            const copy = [...prev];
            copy[idx] = false;
            return copy;
        });
      }

      if (shouldOptimize && flippedIndices.length > 5) {
        const remainingPages = flippedIndices.slice(5);
        setPageChecks(prev => {
          const copy = [...prev];
          remainingPages.forEach(idx => {
            copy[idx] = false;
          });
          return copy;
        });
        setUnflipping(prev => {
          const copy = [...prev];
          remainingPages.forEach(idx => {
            copy[idx] = false;
          });
          return copy;
        });
      }

      await new Promise(res => setTimeout(res, 50));
      setCoverChecked(false);
      await new Promise(res => setTimeout(res, coverMs));
      setFadingOut(true);
      await new Promise(res => setTimeout(res, fadeMs));
    } finally {
      setIsClosing(false);
      setFadingOut(false);
      if (typeof onClose === 'function') onClose();
    }
  };

  const handlePageChange = (index, checked) => {
    setPageChecks(prev => {
      const copy = [...prev];
      copy[index] = checked;
      return copy;
    });
  };

  const currentIndex = useMemo(() => {
    const idx = pageChecks.findIndex(c => !c);
    return idx === -1 ? -1 : idx;
  }, [pageChecks]);

  const lastFlippedIndex = useMemo(() => {
    if (currentIndex === -1) return pagesCount - 1; 
    return currentIndex - 1;
  }, [currentIndex, pagesCount]);

  const handleNext = (i) => {
    if (i < 0 || i >= pagesCount - 1) return;
    // only allow next on the current front page
    if (i !== currentIndex) return;
    handlePageChange(i, true);
  };

  const handlePrev = (i) => {
    if (i < 0 || i >= pagesCount) return;
    // only allow prev on the last flipped page
    if (i !== lastFlippedIndex) return;
    handlePageChange(i, false);
  };

  const dynamicStyles = useMemo(() => {
    let s = '';

    for (let i = 0; i < pagesCount; i++) {
      const pageId = `page-${uid}-${i + 1}`;
      const z = pagesCount - i;
        s += `#${pageId} { z-index: ${z}; transition: transform var(--flip-duration, 1s); will-change: transform; }\n`;
        s += `@keyframes flipZ-${uid}-${i + 1} { 0% { z-index: ${pagesCount + 3}; } 99% { z-index: ${pagesCount + 3}; } 100% { z-index: 0; } }\n`;
        s += `.book #${pageId}[data-flipped="true"] { transform: rotateY(-180deg); animation: flipZ-${uid}-${i + 1} var(--flip-duration, 1s) forwards; }\n`;
        s += `@keyframes flipBackZ-${uid}-${i + 1} { 0% { z-index: ${pagesCount + 3}; } 99% { z-index: ${pagesCount + 3}; } 100% { z-index: ${z}; } }\n`;
        s += `.book #${pageId}[data-unflipping="true"] { transform: rotateY(0deg); animation: flipBackZ-${uid}-${i + 1} var(--flip-duration, 1s) forwards; }\n`;
    }

    return s;
  }, [pagesCount, uid]);

  return (
    <div className="flc-overlay" onClick={handleCloseAnimated}>
      <div className="flc-container" onClick={e => e.stopPropagation()}>
        {/* per-instance style block for dynamic selectors */}
        <style>{dynamicStyles}</style>

        <input
          type="checkbox"
          id={`checkbox-cover-${uid}`}
          checked={coverChecked}
          onChange={e => setCoverChecked(e.target.checked)}
        />

        <div className="book-container">
          {coverChecked && !isOpening && (
            <>
              <button 
                className="nav-arrow nav-arrow-left"
                onClick={() => {
                  if (lastFlippedIndex >= 1) handlePrev(lastFlippedIndex);
                }}
                disabled={lastFlippedIndex < 1}
                title="Previous Page"
              >
                «
              </button>
              
              <button 
                className="nav-arrow nav-arrow-right"
                onClick={() => {
                  if (currentIndex >= 0 && currentIndex < pagesCount - 1) handleNext(currentIndex);
                }}
                disabled={currentIndex < 0 || currentIndex >= pagesCount - 1}
                title="Next Page"
              >
                »
              </button>
            </>
          )}

          {coverChecked && !isOpening && (
            <div className="page-counter">
              Page {lastFlippedIndex + 2}/27
            </div>
          )}

          <div
            className="flc-book-wrap"
            data-fading={fadingOut ? 'true' : 'false'}
            data-fast={isClosing || isOpening ? 'true' : 'false'}
            data-cover={coverChecked ? 'open' : 'closed'}
            data-opening={isOpening ? 'true' : 'false'}
          >
          <div className="book">
            <div className="cover">
              <div className="cover-content">
                <h1 className="cover-title">
                  <div className="title-line">Cat</div>
                  <div className="title-line">Fact</div>
                  <div className="title-line">Collection</div>
                </h1>
                <div className="cover-cat">
                  <img src="/images/catcover.png" alt="Cute cat" className="cover-cat-img" />
                </div>
              </div>
              <label htmlFor={`checkbox-cover-${uid}`} />
            </div>

            {Array.from({ length: pagesCount }).map((_, i) => (
              <div
                className="page"
                id={`page-${uid}-${i + 1}`}
                data-flipped={pageChecks[i] ? 'true' : 'false'}
                data-unflipping={unflipping[i] ? 'true' : 'false'}
                data-current={currentIndex === i ? 'true' : 'false'}
                data-lastflipped={pageChecks[i] && i === lastFlippedIndex ? 'true' : 'false'}
                key={i}
              >
                <div className="front-page">
                  {i === 0 ? (
                    <div className="intro-page">
                      <h2 className="intro-title">Cat Facts Library</h2>
                      <p className="intro-text">Welcome to your collection of fascinating cat facts!</p>
                      <p className="intro-subtitle">Explore amazing feline knowledge.</p>
                    </div>
                  ) : (

                    <>
                      <h3 className="page-title">Page {i + 1}</h3>
                      <div className="fact-grid-container">
                        <div className="fact-grid">
                        {Array.from({ length: 9 }).map((_, cardIndex) => {
                          const factNumber = ((i - 1) * 9) + cardIndex + 1; 
                          const isEncountered = encounteredFacts[factNumber] || facts[factNumber - 1];
                          const isSelected = pageSelectedFacts[i] === factNumber;
                          const isClickable = !!isEncountered;
                          const isNew = libraryNewIds.includes(factNumber);
                          
                          return (
                            <div 
                              key={cardIndex} 
                              className={`fact-card ${
                                !isClickable ? 'unencountered' : 
                                isSelected ? 'selected' : 'encountered'
                              }`}
                              onClick={isClickable && !isSelected ? (e) => {
                                e.stopPropagation();
                                setPageSelectedFacts(prev => {
                                  return { ...prev, [i]: factNumber };
                                });
                                if (isNew && onMarkViewed) {
                                  onMarkViewed(factNumber);
                                }
                              } : undefined}
                            >
                              {!isClickable ? (
                                <>
                                  <div className="mystery-icon">?</div>
                                </>
                              ) : (
                                <>
                                  <div className="fact-label">Cat Fact</div>
                                  <div className="fact-number">#{factNumber}</div>
                                </>
                              )}
                            </div>
                          );
                        })}
                        </div>

                        {/* Paw notification overlay grid */}
                        <div className="paw-overlay-grid">
                          {Array.from({ length: 9 }).map((_, cardIndex) => {
                            const factNumber = ((i - 1) * 9) + cardIndex + 1;
                            const isEncountered = encounteredFacts[factNumber] || facts[factNumber - 1];
                            const isNew = libraryNewIds.includes(factNumber);
                            
                            return (
                              <div key={cardIndex} className="paw-overlay-cell">
                                {isEncountered && isNew && (
                                  <img src="/images/paw.png" alt="new" className="paw-notif pulse" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="back-page">
                  <div className="back-content">
                    {(() => {
                      const selectedFactNumber = pageSelectedFacts[i + 1];
                      const hasSelectedFact = selectedFactNumber !== undefined && selectedFactNumber !== null;
                      
                      if (!hasSelectedFact) {
                        return (
                          <div className="idle-placeholder">
                            <div className="idle-cat">
                              <img src="/images/catfact.png" alt="Sleeping cat" className="idle-cat-img" />
                            </div>
                            <p className="idle-text">No fact selected</p>
                            <p className="idle-subtitle">Select a fact card to display it here!</p>
                          </div>
                        );
                      }
                      
                      const factText = encounteredFacts[selectedFactNumber] || facts[selectedFactNumber - 1] || `Amazing cat fact #${selectedFactNumber} goes here! This is where the detailed information about cats would be displayed.`;
                      
                      return (
                        <div className="facts-display">
                          <div className="single-fact-container">
                            <div className="fact-content">
                              <div className="fact-header">
                                <span className="fact-badge">Fact #{selectedFactNumber}</span>
                                <div className="fact-paw">🐾</div>
                              </div>
                              <p className="fact-text-large">
                                {factText}
                              </p>
                            </div>
                          </div>

                          {/* Cat overlay */}
                          <div className="cat-overlay">
                            <img src="/images/catfact.png" alt="Cat reading" className="cat-reading-overlay" />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}

            <div className="back-cover" />
          </div>
        </div>
        </div>

        <div className="flc-close-row">
          <button onClick={handleCloseAnimated} className="flc-close-btn">Close</button>
        </div>
      </div>
    </div>
  );
}
