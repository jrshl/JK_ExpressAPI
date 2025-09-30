import React from 'react';

const AnswerReveal = ({ correctAnswer, onClose }) => {
  if (!correctAnswer) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        maxWidth: '80%',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#5d4037', marginBottom: '1rem' }}>
          🐾 Correct Answer
        </h3>
        <div style={{
          padding: '1rem',
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          margin: '1rem 0',
          fontSize: '1.1rem',
          color: '#2e7d32',
          fontFamily: 'inherit'
        }}>
          "{correctAnswer}"
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '10px 24px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export default AnswerReveal;