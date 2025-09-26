import React, { useState, useEffect, useRef } from 'react';
import GameControls from '../components/GameControls';
import GameStatus from '../components/GameStatus';
import FactDisplay from '../components/FactDisplay';
import './TriviaMaster.css';

const TriviaMaster = () => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [currentFact, setCurrentFact] = useState("Press \"Start Game\" to begin!");
  const [missingWord, setMissingWord] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState("");
  const [inputDisabled, setInputDisabled] = useState(true);
  const [showingCompleteFact, setShowingCompleteFact] = useState(true);
  
  const timerRef = useRef(null);
  const factTimeoutRef = useRef(null);

  // Fetch a random cat fact
  const fetchFact = async () => {
    try {
      const res = await fetch("https://meowfacts.herokuapp.com/");
      const data = await res.json();
      return data.data[0];
    } catch {
      return "Cats are amazing creatures with incredible abilities!";
    }
  };

  // Start the game
  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setResult("");
    setGameActive(true);
    setInputDisabled(false);
    setCurrentFact("Loading fact...");
    
    loadFact();

    // Start the countdown timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame("⏳ Time's up! Final Score: " + score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Load a new fact and hide a word after 5 seconds
  const loadFact = async () => {
    const fact = await fetchFact();
    setCurrentFact(fact);
    setShowingCompleteFact(true);
    setUserAnswer("");
    setResult("");

    // Wait 5 seconds before hiding a word
    if (factTimeoutRef.current) clearTimeout(factTimeoutRef.current);
    factTimeoutRef.current = setTimeout(() => {
      const words = fact.split(" ");
      if (words.length > 1) {
        const randomIndex = Math.floor(Math.random() * words.length);
        const wordToHide = words[randomIndex].replace(/[^a-zA-Z]/g, ""); // strip punctuation
        setMissingWord(wordToHide);
        words[randomIndex] = "_____";
        setCurrentFact(words.join(" "));
        setShowingCompleteFact(false);
      }
    }, 5000);
  };

  // Check the user's answer
  const checkAnswer = () => {
    const trimmedAnswer = userAnswer.trim().toLowerCase();
    const correctAnswer = missingWord.toLowerCase();
    
    if (trimmedAnswer === correctAnswer) {
      setScore(prev => prev + 1);
      setResult("✅ Correct!");
    } else {
      setResult(`❌ Wrong! The missing word was: ${missingWord}`);
    }
    
    // Load next fact after a short delay
    setTimeout(() => {
      loadFact();
    }, 2000);
  };

  // End the game
  const endGame = (message) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (factTimeoutRef.current) clearTimeout(factTimeoutRef.current);
    
    setResult(message);
    setGameActive(false);
    setInputDisabled(true);
    setCurrentFact("Press \"Start Game\" to begin!");
    setUserAnswer("");
  };

  // Cancel the game
  const cancelGame = () => {
    endGame("❌ Game canceled!");
    setScore(0);
    setTimeLeft(0);
  };

  // Handle Enter key press for answer submission
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !inputDisabled && !showingCompleteFact) {
      checkAnswer();
    }
  };

  // Cleanup timers on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (factTimeoutRef.current) clearTimeout(factTimeoutRef.current);
    };
  }, []);

  return (
    <div className="trivia-container">
      <div className="trivia-overlay">
        <h1 className="trivia-title">🐱 Cat Trivia Fill-in-the-Blank</h1>
        <p className="trivia-instructions">
          You'll see a cat fact for 5 seconds 🐾. After that, a word will be missing - can you fill it in? ⏳
        </p>

        <div className="trivia-controls">
          <GameControls
            onStartGame={startGame}
            onCancelGame={cancelGame}
            gameActive={gameActive}
            showDifficulty={false}
            startText="Start Game"
            cancelText="Cancel"
          />
        </div>

        <div className="trivia-game-area">
          <FactDisplay fact={currentFact} className="trivia-fact" />
          
          <div className="trivia-input-area">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type missing word..."
              disabled={inputDisabled || showingCompleteFact}
              className="trivia-answer-input"
            />
            <button
              onClick={checkAnswer}
              disabled={inputDisabled || showingCompleteFact || !userAnswer.trim()}
              className="trivia-submit-btn"
            >
              Submit
            </button>
          </div>
        </div>

        <div className="trivia-status">
          <GameStatus
            timeLeft={timeLeft}
            result={result}
            score={score}
            showProgress={false}
            showScore={true}
          />
        </div>
      </div>
    </div>
  );
};

export default TriviaMaster;