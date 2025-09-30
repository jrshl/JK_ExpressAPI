import React, { useState, useEffect, useRef } from 'react';
import FactDisplay from '../components/FactDisplay';
import './TriviaMaster.css';

const TOTAL_GAME_TIME = 120; // total game time in seconds
const FACT_DISPLAY_TIME = 30000; // full fact display 30s
const CURTAIN_TIME = 5000; // curtain 5s
const ANSWER_TIME = 30000; // player has 30s to answer each missing word

const TriviaMaster = () => {
  const [stage, setStage] = useState('intro'); // intro, showFact, curtain, missingWord, results
  const [currentFact, setCurrentFact] = useState('');
  const [missingWord, setMissingWord] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const [gameTimeLeft, setGameTimeLeft] = useState(TOTAL_GAME_TIME);
  const [answerTimeLeft, setAnswerTimeLeft] = useState(ANSWER_TIME / 1000);

  const gameTimerRef = useRef(null);
  const answerTimerRef = useRef(null);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchFact = async () => {
    try {
      const res = await fetch('https://meowfacts.herokuapp.com/');
      const data = await res.json();
      return data.data[0];
    } catch {
      return 'Cats are amazing creatures with incredible abilities!';
    }
  };

  const startGame = async () => {
    setGameHistory([]);
    setGameTimeLeft(TOTAL_GAME_TIME);
    setStage('showFact');

    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    gameTimerRef.current = setInterval(() => {
      setGameTimeLeft(prev => {
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

    await sleep(FACT_DISPLAY_TIME);

    setStage('curtain');
    await sleep(CURTAIN_TIME);

    const words = fact.split(' ');
    let wordToHide = '';
    if (words.length > 1) {
      const randomIndex = Math.floor(Math.random() * words.length);
      wordToHide = words[randomIndex].replace(/[^a-zA-Z]/g, '');
      words[randomIndex] = '_____';
    }

    setMissingWord(wordToHide);
    setCurrentFact(words.join(' '));
    setStage('missingWord');
    setAnswerTimeLeft(ANSWER_TIME / 1000);

    if (answerTimerRef.current) clearInterval(answerTimerRef.current);
    answerTimerRef.current = setInterval(() => {
      setAnswerTimeLeft(prev => {
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
    setGameHistory(prev => [
      ...prev,
      { fact: fullFact, correctWord, userAnswer: '', isCorrect: false }
    ]);
    if (gameTimeLeft > 0) nextFact();
  };

  const submitAnswer = () => {
    if (!userAnswer.trim()) return;
    const isCorrect = userAnswer.trim().toLowerCase() === missingWord.toLowerCase();
    setGameHistory(prev => [
      ...prev,
      { fact: currentFact.replace('_____', missingWord), correctWord: missingWord, userAnswer, isCorrect }
    ]);
    if (answerTimerRef.current) clearInterval(answerTimerRef.current);
    if (gameTimeLeft > 0) nextFact();
  };

  const endGame = () => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (answerTimerRef.current) clearInterval(answerTimerRef.current);
    setStage('results');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && stage === 'missingWord') submitAnswer();
  };

  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (answerTimerRef.current) clearInterval(answerTimerRef.current);
    };
  }, []);

  return (
    <div className="trivia-wrapper">
      {/* Background Cat */}
      <div className="background-cat"></div>
      
      <div className="trivia-box">

        {/* Intro Stage */}
        {stage === 'intro' && (
          <>
            <h1 className="trivia-title">🐱 Cat Trivia Fill-in-the-Blank</h1>
            <p className="trivia-instructions">
              You'll see a cat fact for 30 seconds 🐾. After that, the screen will hide briefly, and then one word will be missing. Fill it in! ⏳
            </p>
            <div className="trivia-controls">
              <button className="start-btn" onClick={startGame}>Start Game</button>
            </div>
          </>
        )}

        {/* Show full fact */}
        {stage === 'showFact' && <FactDisplay fact={currentFact} className="trivia-fact" />}

        {/* Curtain */}
        {stage === 'curtain' && (
          <div className="curtain"><span>Please Wait...</span></div>
        )}

        {/* Missing word stage */}
        {stage === 'missingWord' && (
          <>
            <FactDisplay fact={currentFact} className="trivia-fact" />
            <div className="trivia-input-area">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type missing word..."
                className="trivia-answer-input"
              />
              <button
                onClick={submitAnswer}
                disabled={!userAnswer.trim()}
                className="trivia-submit-btn"
              >Submit</button>
            </div>
            <div className="trivia-status">
              <p>⏳ Time left: {answerTimeLeft}s</p>
              <p>🕒 Game Time: {gameTimeLeft}s</p>
            </div>
          </>
        )}

        {/* Results */}
        {stage === 'results' && (
          <>
            <div className="results-container" style={{ display: 'flex', gap: '20px', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <h3>✅ Correct Answers</h3>
                {gameHistory.filter(f => f.isCorrect).map((f, idx) => (
                  <div key={idx} className="trivia-fact" style={{ marginBottom: '10px' }}>
                    <p>{f.fact}</p>
                    <p>Your answer: {f.userAnswer}</p>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <h3>❌ Wrong Answers</h3>
                {gameHistory.filter(f => !f.isCorrect).map((f, idx) => (
                  <div key={idx} className="trivia-fact" style={{ marginBottom: '10px' }}>
                    <p>{f.fact}</p>
                    <p>Your answer: {f.userAnswer || '(No answer)'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button className="start-btn" onClick={startGame}>Start New Game</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TriviaMaster;
