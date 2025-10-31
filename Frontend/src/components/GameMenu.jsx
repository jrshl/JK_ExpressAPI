import React from 'react';
import './GameMenu.css';

const GameMenu = ({ isOpen, onClose, onResume, onRestart, onExit }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="menu-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Menu</h2>
        <div className="menu-buttons">
          <button className="menu-btn" onClick={onResume}>Resume</button>
          <button className="menu-btn" onClick={onRestart}>Restart</button>
          <button className="menu-btn" onClick={onExit}>Exit</button>
        </div>
      </div>
    </div>
  );
};

export default GameMenu;