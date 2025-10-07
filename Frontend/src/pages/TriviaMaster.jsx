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
  const [introStep, setIntroStep] = useState(0);
  const [currentFact, setCurrentFact] = useState('');
  const [missingWord, setMissingWord] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const [answerTimeLeft, setAnswerTimeLeft] = useState(ANSWER_TIME);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const isPausedRef = useRef(isPaused);
  const answerTimerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const sleep = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));

  const fetchFact = async () => {
    try {
      const res = await fetch('https://meowfacts.herokuapp.com/');
      const data = await res.json();
      return data.data[0];
    } catch {
      return 'Cats are amazing creatures with incredible abilities!';
    }
  };

  const clearAllTimers = () => {
    if (answerTimerRef.current) clearInterval(answerTimerRef.current);
    answerTimerRef.current = null;
  };

  const restartToIntro = () => {
    clearAllTimers();
    setStage('intro');
    setIntroStep(0);
    setGameHistory([]);
    setCurrentFact('');
    setMissingWord('');
    setUserAnswer('');
    setAnswerTimeLeft(ANSWER_TIME);
    setIsMenuOpen(false);
    setIsPaused(false);
  };

  const startGame = async () => {
    clearAllTimers();
    setGameHistory([]);
    setCurrentFact('');
    setMissingWord('');
    setUserAnswer('');
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

    const fact = await fetchFact();
    setCurrentFact(fact);

    startAnswerTimer(FACT_DISPLAY_TIME, () => showCurtain(fact));
  };

  const showCurtain = async (fact) => {
    setStage('curtain');

    for (let i = 0; i < CURTAIN_TIME; i++) {
      if (answerTimerRef.current === null) return; // exit if cancelled
      await sleep(1);
    }

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

    startAnswerTimer(ANSWER_TIME, () => handleAnswerTimeout(wordToHide, fact));
  };

  const handleAnswerTimeout = (correctWord, fullFact) => {
    setGameHistory((prev) => [
      ...prev,
      { fact: fullFact, correctWord, userAnswer: '', isCorrect: false },
    ]);
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
        "You'll see a cat fact for 15 seconds 🐾. After that, the screen will hide briefly, and then one word will be missing. Fill it in!",
    },
    { type: 'image', src: '/images/guide1.png' },
    { type: 'image', src: '/images/tutorial2.png' },
    { type: 'image', src: '/images/tutorial3.png' },
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
                onClick={() => { setIsMenuOpen(false); restartToIntro(); }}
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
                  {introSteps[introStep].type === 'text' ? (
                    <p>{introSteps[introStep].content}</p>
                  ) : (
                    <img src={introSteps[introStep].src} alt={`Step ${introStep + 1}`} className="intro-image" />
                  )}
                </div>
                <div className="intro-controls">
                  {introStep > 0 && (
                    <button className="prev-btn" onClick={() => setIntroStep((s) => s - 1)}>Previous</button>
                  )}
                  {introStep < introSteps.length - 1 ? (
                    <button className="next-btn" onClick={() => setIntroStep((s) => s + 1)}>Next</button>
                  ) : (
                    <button className="start-btn" onClick={startGame}>Start Game</button>
                  )}
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
                    clearAllTimers(); // cancel timers & delays
                    nextFact();       // fetch next fact instantly
                  }}
                >
                  Next Fact
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
