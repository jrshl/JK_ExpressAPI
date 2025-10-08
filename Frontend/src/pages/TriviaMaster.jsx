import React, { useState, useEffect, useRef } from 'react';
import './TriviaMaster.css';

const TOTAL_GAME_TIME = 120;   // 2 minutes
const FACT_DISPLAY_TIME = 30;  // show fact for 30s
const CURTAIN_TIME = 5;        // hide for 5s
const ANSWER_TIME = 30;        // 30s answer time

// 🔑 Auto Resize Text Component
const AutoResizeText = ({ text, maxFontSize = 22, minFontSize = 12 }) => {
  const boxRef = useRef(null);
  const textRef = useRef(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useEffect(() => {
    if (!boxRef.current || !textRef.current) return;

    let newSize = maxFontSize;
    textRef.current.style.fontSize = `${newSize}px`;

    // shrink text until it fits
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
        textAlign: "center",
      }}
    >
      <p
        ref={textRef}
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: "bold",
          lineHeight: 1.4,
          margin: 0,
          wordBreak: "break-word",
        }}
      >
        {text}
      </p>
    </div>
  );
};

const TriviaMaster = () => {
  const [stage, setStage] = useState('intro');
  const [introStep, setIntroStep] = useState(0);
  const [currentFact, setCurrentFact] = useState('');
  const [missingWord, setMissingWord] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const [gameTimeLeft, setGameTimeLeft] = useState(TOTAL_GAME_TIME);
  const [answerTimeLeft, setAnswerTimeLeft] = useState(ANSWER_TIME);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const gameTimerRef = useRef(null);
  const answerTimerRef = useRef(null);

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
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (answerTimerRef.current) clearInterval(answerTimerRef.current);
    gameTimerRef.current = null;
    answerTimerRef.current = null;
  };

  const pauseTimers = () => clearAllTimers();

  const resumeTimers = () => {
    if (stage === 'showFact' && answerTimeLeft > 0) {
      answerTimerRef.current = setInterval(() => {
        setAnswerTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(answerTimerRef.current);
            showCurtain(currentFact);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    if (stage === 'missingWord' && answerTimeLeft > 0) {
      answerTimerRef.current = setInterval(() => {
        setAnswerTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(answerTimerRef.current);
            handleAnswerTimeout(missingWord, currentFact);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    if (stage !== 'intro' && stage !== 'results' && gameTimeLeft > 0) {
      gameTimerRef.current = setInterval(() => {
        setGameTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(gameTimerRef.current);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const restartToIntro = () => {
    clearAllTimers();
    setStage('intro');
    setIntroStep(0);
    setGameHistory([]);
    setCurrentFact('');
    setMissingWord('');
    setUserAnswer('');
    setGameTimeLeft(TOTAL_GAME_TIME);
    setAnswerTimeLeft(ANSWER_TIME);
    setIsMenuOpen(false);
  };

  const startGame = async () => {
    clearAllTimers();
    setGameHistory([]);
    setCurrentFact('');
    setMissingWord('');
    setUserAnswer('');
    setGameTimeLeft(TOTAL_GAME_TIME);

    setStage('showFact');

    gameTimerRef.current = setInterval(() => {
      setGameTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(gameTimerRef.current);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    await nextFact();
  };

  const nextFact = async () => {
    if (gameTimeLeft <= 0) return endGame();

    setStage('showFact');
    const fact = await fetchFact();
    setCurrentFact(fact);
    setUserAnswer('');
    setMissingWord('');

    setAnswerTimeLeft(FACT_DISPLAY_TIME);
    if (answerTimerRef.current) clearInterval(answerTimerRef.current);
    answerTimerRef.current = setInterval(() => {
      setAnswerTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(answerTimerRef.current);
          showCurtain(fact);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const showCurtain = async (fact) => {
    setStage('curtain');
    await sleep(CURTAIN_TIME);
    if (gameTimeLeft <= 0) return endGame();

    const words = fact.split(' ');
    let wordToHide = '';
    if (words.length > 1) {
      const randomIndex = Math.floor(Math.random() * words.length);
      wordToHide = words[randomIndex].replace(/[^a-zA-Z]/g, '');
      words[randomIndex] = '_'.repeat(wordToHide.length);
    }

    setMissingWord(wordToHide);
    setCurrentFact(words.join(' '));
    setStage('missingWord');
    setAnswerTimeLeft(ANSWER_TIME);

    if (answerTimerRef.current) clearInterval(answerTimerRef.current);
    answerTimerRef.current = setInterval(() => {
      setAnswerTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(answerTimerRef.current);
          handleAnswerTimeout(wordToHide, fact);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswerTimeout = (correctWord, fullFact) => {
    setGameHistory((prev) => [
      ...prev,
      { fact: fullFact, correctWord, userAnswer: '', isCorrect: false },
    ]);

    setStage('factResult');
    setTimeout(() => {
      if (gameTimeLeft > 0) nextFact();
      else endGame();
    }, 3000);
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

    if (answerTimerRef.current) clearInterval(answerTimerRef.current);

    setStage('factResult');
    setTimeout(() => {
      if (gameTimeLeft > 0) nextFact();
      else endGame();
    }, 3000);
  };

  const endGame = () => {
    clearAllTimers();
    setStage('results');
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

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  const circumference = 2 * Math.PI * 16;
  const progressPct =
    (answerTimeLeft /
      (stage === 'showFact' ? FACT_DISPLAY_TIME : ANSWER_TIME)) * 100;
  const dashOffset = circumference - (progressPct / 100) * circumference;

  const introSteps = [
    { type: 'text', content: 'Welcome to Trivia Master!' },
    {
      type: 'text',
      content:
        "You'll see a cat fact for 30 seconds 🐾. After that, the screen will hide briefly, and then one word will be missing. Fill it in!",
    },
    { type: 'image', src: '/images/guide1.png' },
    { type: 'image', src: '/images/tutorial2.png' },
    { type: 'image', src: '/images/tutorial3.png' },
  ];

  return (
    <div className="trivia-wrapper" tabIndex={0} onKeyDown={handleKeyPress}>
      {/* === HAMBURGER === */}
      <button
        className="hamburger"
        onClick={() => {
          setIsMenuOpen(true);
          pauseTimers();
        }}
      >
        <span></span><span></span><span></span>
      </button>

      {/* === INTRO === */}
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
                  {introSteps[introStep].type === 'text' && (
                    <p>{introSteps[introStep].content}</p>
                  )}
                  {introSteps[introStep].type === 'image' && (
                    <img
                      src={introSteps[introStep].src}
                      alt={`Step ${introStep + 1}`}
                      className="intro-image"
                    />
                  )}
                </div>
                <div className="intro-controls">
                  {introStep > 0 && (
                    <button
                      className="prev-btn"
                      onClick={() => setIntroStep((s) => s - 1)}
                    >
                      Previous
                    </button>
                  )}
                  {introStep < introSteps.length - 1 ? (
                    <button
                      className="next-btn"
                      onClick={() => setIntroStep((s) => s + 1)}
                    >
                      Next
                    </button>
                  ) : (
                    <button className="start-btn" onClick={startGame}>
                      Start Game
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === RESULTS SCREEN === */}
      {stage === 'results' && (
        <div className="results-screen">
          <h3>Results</h3>
          <div className="results-grid">
            <div>
              <h4>✅ Correct</h4>
              {gameHistory
                .filter((f) => f.isCorrect)
                .map((f, idx) => (
                  <p key={idx} className="result-item">{f.fact}</p>
                ))}
            </div>
            <div>
              <h4>❌ Wrong</h4>
              {gameHistory
                .filter((f) => !f.isCorrect)
                .map((f, idx) => (
                  <p key={idx} className="result-item">
                    {f.fact} <br />
                    Your answer: {f.userAnswer || '(No answer)'} <br />
                    Correct: {f.correctWord}
                  </p>
                ))}
            </div>
          </div>
          <div className="results-actions">
            <button className="start-btn" onClick={restartToIntro}>
              Back to Guide
            </button>
            <button className="start-btn" onClick={startGame}>
              Start New Game
            </button>
          </div>
        </div>
      )}

      {/* === GAME === */}
      {stage !== 'intro' && stage !== 'results' && (
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
                    cx="18"
                    cy="18"
                    r="16"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
                <span className="timer-text">{answerTimeLeft}s</span>
              </div>
            )}

            {stage === 'showFact' && (
              <AutoResizeText text={currentFact} />
            )}

            {stage === 'curtain' && (
              <div className="curtain">Please Wait...</div>
            )}

            {stage === 'missingWord' && (
              <div className="trivia-game-area">
                <AutoResizeText
                  text={currentFact.replace(
                    '_'.repeat(missingWord.length),
                    [...missingWord]
                      .map((_, i) => userAnswer[i] || '_')
                      .join('')
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
              <div className="fact-result">
                <p>{gameHistory.at(-1).fact}</p>
                {gameHistory.at(-1).isCorrect ? (
                  <p className="correct">✅ Correct!</p>
                ) : (
                  <p className="wrong">
                    ❌ Wrong! Correct answer: {gameHistory.at(-1).correctWord}
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* === MODAL === */}
      {isMenuOpen && (
        <div className="modal-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Menu</h2>
            <div className="modal-actions">
              <button
                className="modal-btn"
                onClick={() => {
                  setIsMenuOpen(false);
                  resumeTimers();
                }}
              >
                Resume
              </button>
              <button className="modal-btn" onClick={restartToIntro}>
                Restart
              </button>
              <button className="modal-btn danger" onClick={restartToIntro}>
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TriviaMaster;
