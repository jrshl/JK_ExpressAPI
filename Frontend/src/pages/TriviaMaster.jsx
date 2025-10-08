import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './TriviaMaster.css';

const FACT_DISPLAY_TIME = 10;
const CURTAIN_TIME = 5;
const ANSWER_TIME = 10;

const AutoResizeText = ({ text, maxFontSize = 22, minFontSize = 12 }) => {
  const boxRef = useRef(null);
  const textRef = useRef(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useEffect(() => {
    if (!boxRef.current || !textRef.current) return;
    let newSize = maxFontSize;
    textRef.current.style.fontSize = `${newSize}px`;

    while (
      (textRef.current.scrollHeight > boxRef.current.clientHeight ||
        textRef.current.scrollWidth > boxRef.current.clientWidth) &&
      newSize > minFontSize
    ) {
      newSize -= 1;
      textRef.current.style.fontSize = `${newSize}px`;
    }
    setFontSize(newSize);
  }, [text, maxFontSize, minFontSize]);

  return (
    <div
      ref={boxRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        textAlign: "center"
      }}
    >
      <p
        ref={textRef}
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: "bold",
          lineHeight: 1.4,
          margin: 0,
          wordBreak: "break-word"
        }}
        dangerouslySetInnerHTML={{ __html: text }}
      ></p>
    </div>
  );
};

const TriviaMaster = () => {
  const [stage, setStage] = useState('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentFact, setCurrentFact] = useState('');
  const [originalFact, setOriginalFact] = useState(''); 
  const [missingWord, setMissingWord] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const [answerTimeLeft, setAnswerTimeLeft] = useState(ANSWER_TIME);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [shouldRetryFact, setShouldRetryFact] = useState(false);

  const isPausedRef = useRef(isPaused);
  const answerTimerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const sleep = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));

  const fetchFact = async () => {
    try {
      const res = await fetch(`/api/facts?count=1`);
      const data = await res.json();
      const list = Array.isArray(data.fact) ? data.fact : Array.isArray(data.facts) ? data.facts : Array.isArray(data.data) ? data.data : [data.data];
      return list[0] || 'Cats are amazing creatures with incredible abilities!';
    } catch {
      return 'Cats are amazing creatures with incredible abilities!';
    }
  };

  const clearAllTimers = () => {
    if (answerTimerRef.current) clearInterval(answerTimerRef.current);
    answerTimerRef.current = null;
  };

  const restartGame = async () => {
    clearAllTimers();
    setGameHistory([]);
    setCurrentFact('');
    setOriginalFact('');
    setMissingWord('');
    setUserAnswer('');
    setAnswerTimeLeft(ANSWER_TIME);
    setIsMenuOpen(false);
    setIsPaused(false);
    setShouldRetryFact(false);
    setStage('showFact');
    await nextFact();
  };

  const startGame = async () => {
    clearAllTimers();
    setGameHistory([]);
    setCurrentFact('');
    setOriginalFact('');
    setMissingWord('');
    setUserAnswer('');
    setShouldRetryFact(false);
    setStage('showFact');
    await nextFact();
  };

  const startAnswerTimer = (duration, onTimeout) => {
    setAnswerTimeLeft(duration);
    clearAllTimers();
    answerTimerRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        setAnswerTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(answerTimerRef.current);
            onTimeout();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
  };

  const nextFact = async () => {
    // Cancel ongoing timers
    clearAllTimers();

    setCurrentFact('');
    setMissingWord('');
    setUserAnswer('');
    setStage('showFact');

    let fact;
    if (shouldRetryFact && originalFact) {
      // Use the original fact for retry
      fact = originalFact;
      setShouldRetryFact(false); 
    } else {
      // Fetch new fact
      fact = await fetchFact();
      setOriginalFact(fact); 
    }
    
    setCurrentFact(fact);
    startAnswerTimer(FACT_DISPLAY_TIME, () => showCurtain(fact));
  };

  const selectRandomWord = (fact, excludeWord = '') => {
    const words = fact.split(' ');
    
    const validWords = words.map((word, index) => ({
      word: word.replace(/[^a-zA-Z]/g, ''),
      index,
      original: word
    })).filter(item => 
      item.word.length > 2 && 
      item.word.toLowerCase() !== excludeWord.toLowerCase()
    );

    if (validWords.length === 0) {
      // Fallback to any word if no valid words found
      const randomIndex = Math.floor(Math.random() * words.length);
      return {
        word: words[randomIndex].replace(/[^a-zA-Z]/g, ''),
        index: randomIndex
      };
    }

    const randomValidWord = validWords[Math.floor(Math.random() * validWords.length)];
    return {
      word: randomValidWord.word,
      index: randomValidWord.index
    };
  };

  const showCurtain = async (fact) => {
    setStage('curtain');

    for (let i = 0; i < CURTAIN_TIME; i++) {
      if (answerTimerRef.current === null) return; 
      await sleep(1);
    }

    const words = fact.split(' ');
    let wordToHide = '';
    
    if (words.length > 1) {
      
      const lastGame = gameHistory[gameHistory.length - 1];
      const excludeWord = (shouldRetryFact && lastGame && !lastGame.isCorrect) ? lastGame.correctWord : '';
      
      const selection = selectRandomWord(fact, excludeWord);
      wordToHide = selection.word;
      words[selection.index] = '_'.repeat(wordToHide.length);
    }

    setMissingWord(wordToHide);
    setCurrentFact(words.join(' '));
    setStage('missingWord');

    startAnswerTimer(ANSWER_TIME, () => handleAnswerTimeout(wordToHide, fact));
  };

  const handleAnswerTimeout = (correctWord, fullFact) => {
    setGameHistory((prev) => [
      ...prev,
      { fact: fullFact, correctWord, userAnswer: '', isCorrect: false },
    ]);
    setShouldRetryFact(true); 
    setStage('factResult');
  };

  const submitAnswer = () => {
    if (userAnswer.length !== missingWord.length) return;

    const isCorrect =
      userAnswer.trim().toLowerCase() === (missingWord || '').toLowerCase();

    const fullFactRestored = currentFact.replace(
      '_'.repeat(missingWord.length),
      missingWord || ''
    );

    setGameHistory((prev) => [
      ...prev,
      {
        fact: fullFactRestored,
        correctWord: missingWord,
        userAnswer,
        isCorrect,
      },
    ]);

    // Set retry flag based on whether user was correct
    setShouldRetryFact(!isCorrect);

    clearAllTimers();
    setStage('factResult');
  };

  const handleKeyPress = (e) => {
    if (stage === 'missingWord') {
      if (/^[a-zA-Z]$/.test(e.key)) {
        setUserAnswer((prev) => (prev + e.key).slice(0, missingWord.length));
      } else if (e.key === 'Backspace') {
        setUserAnswer((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        submitAnswer();
      }
    }
  };

  useEffect(() => { return () => clearAllTimers(); }, []);

  // Slideshow effect for intro
  useEffect(() => {
    if (stage === 'intro') {
      const slideInterval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % 3); 
      }, 3000); 
      
      return () => clearInterval(slideInterval);
    }
  }, [stage]);

  const circumference = 2 * Math.PI * 16;
  const progressPct =
    (answerTimeLeft /
      (stage === 'showFact' ? FACT_DISPLAY_TIME : ANSWER_TIME)) * 100;
  const dashOffset = circumference - (progressPct / 100) * circumference;

  const slideImages = [
    '/images/guide1.png',
    '/images/guide2.png', 
    '/images/guide3.png'
  ];

  return (
    <div className="trivia-wrapper" tabIndex={0} onKeyDown={handleKeyPress}>
      <button
        className="hamburger"
        onClick={() => { setIsMenuOpen(true); setIsPaused(true); }}
      >
        <span></span><span></span><span></span>
      </button>

      {isMenuOpen && (
        <div className="modal-overlay" onClick={() => { setIsMenuOpen(false); setIsPaused(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Menu</h2>
            <div className="menu-buttons">
              <button
                className="menu-btn resume-btn"
                onClick={() => { setIsMenuOpen(false); setIsPaused(false); }}
              >
                Resume
              </button>
              <button
                className="menu-btn restart-btn"
                onClick={() => { restartGame(); }}
              >
                Restart
              </button>
              <button className="menu-btn exit-btn" onClick={() => navigate("/")}>
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTRO SCREEN */}
      {stage === 'intro' && (
        <div className="intro-screen">
          <div className="intro-header">
            <h1 className="intro-title">TRIVIA MASTER</h1>
          </div>
          <div className="intro-row">
            <div className="intro-cat-wrapper">
              <img src="/images/tmCat.png" alt="Cat" className="intro-cat" />
              <img src="/images/question.png" alt="?" className="cat-question" />
              <img src="/images/question.png" alt="?" className="cat-question1" />
              <img src="/images/question.png" alt="?" className="cat-question2" />
            </div>
            <div className="intro-box-wrapper">
              <div className="intro-bigbox">
                <div className="intro-smallbox">
                  <div className="welcome-text">
                    <p>Welcome to Trivia Master!</p>
                    <p>You'll see a cat fact for 10 seconds 🐾. After that, the screen will hide briefly, and then one word will be missing. Fill it in!</p>
                  </div>
                  <div className="slideshow-container">
                    <img 
                      src={slideImages[currentSlide]} 
                      alt={`Guide ${currentSlide + 1}`} 
                      className="intro-image slideshow-image" 
                      key={currentSlide}
                    />
                  </div>
                </div>
                <div className="intro-controls">
                  <button className="start-btn" onClick={startGame}>Start Game</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAME AREA */}
      {stage !== 'intro' && (
        <>
          <div className="game-cat-wrapper">
            <img src="/images/tmCat.png" alt="Game Cat" className="game-cat" />
          </div>
          <div className="trivia-box">
            {(stage === 'showFact' || stage === 'missingWord') && (
              <div className="answer-timer">
                <svg viewBox="0 0 36 36" className="answer-timer-ring">
                  <circle className="ring-track" cx="18" cy="18" r="16" />
                  <circle
                    className="ring-progress"
                    cx="18" cy="18" r="16"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
                <span className="timer-text">{answerTimeLeft}</span>
              </div>
            )}

            {stage === 'showFact' && <AutoResizeText text={currentFact} />}

            {stage === 'curtain' && <div className="curtain">Please Wait...</div>}

            {stage === 'missingWord' && (
              <div className="trivia-game-area">
                <AutoResizeText
                  text={currentFact.replace(
                    '_'.repeat(missingWord.length),
                    [...missingWord].map((_, i) => userAnswer[i] || '_').join('')
                  )}
                />
                <button
                  onClick={submitAnswer}
                  disabled={userAnswer.length !== missingWord.length}
                  className="trivia-submit-btn"
                >
                  Submit
                </button>
              </div>
            )}

            {stage === 'factResult' && (
              <div className="fact-result-modal">
                {gameHistory.at(-1).isCorrect ? (
                  <div className="correct-word-display">
                    <AutoResizeText
                      text="CORRECT!"
                      maxFontSize={14}
                      minFontSize={6}
                    />
                  </div>
                ) : (
                  <div className="wrong-word-display">
                    <AutoResizeText
                      text={`Try Again!`}
                      maxFontSize={14}
                      minFontSize={6}
                    />
                  </div>
                )}

                <div className="correct-fact-display">
                  <AutoResizeText
                    text={gameHistory.at(-1).fact.replace(
                      gameHistory.at(-1).correctWord,
                      gameHistory.at(-1).isCorrect
                        ? `<span class="green-word">${gameHistory.at(-1).userAnswer}</span>`
                        : `<u>${gameHistory.at(-1).correctWord}</u>`
                    )}
                    maxFontSize={14}
                    minFontSize={6}
                  />
                </div>

                <button
                  className="next-fact-btn"
                  onClick={() => {
                    clearAllTimers(); 
                    nextFact();       
                  }}
                >
                  {gameHistory.at(-1)?.isCorrect ? "Next Fact" : "Try Again"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TriviaMaster;
