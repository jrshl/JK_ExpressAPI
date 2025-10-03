import React, { useState } from "react";
import "./CatGallery.css";

export default function CatGallery({ onClose }) {
  const [selectedCategory, setSelectedCategory] = useState("console");
  const [selectedCat, setSelectedCat] = useState(null);
  const [showCatDetail, setShowCatDetail] = useState(false);
  const [screenDisplayCat, setScreenDisplayCat] = useState(null);
  const [collectedCats, _setCollectedCats] = useState({
    1: true,   // Some cats are already collected for demo
    2: true,
    3: true,
    4: true,
    5: false,
    6: true,
    7: false,
    8: false,
    9: true,
    10: false,
    11: true,
    12: false,
    13: false,
    14: false,
    15: true,
    16: false
  });

  // Cat stickers data - using available images and placeholder data
  const catStickers = {
    console: [
      { id: 1, name: "Home Cat", image: "/images/homeCat.png", rarity: "common" },
      { id: 2, name: "TM Cat", image: "/images/tmCat.png", rarity: "rare" },
      { id: 3, name: "Running Cat", image: "/images/running_cat.gif", rarity: "epic" },
      { id: 4, name: "Sleepy Cat", image: "/images/homeCat.png", rarity: "common" },
      { id: 5, name: "Gaming Cat", image: "/images/tmCat.png", rarity: "rare" },
      { id: 6, name: "Happy Cat", image: "/images/homeCat.png", rarity: "legendary" },
      { id: 7, name: "Cozy Cat", image: "/images/tmCat.png", rarity: "common" },
      { id: 8, name: "Active Cat", image: "/images/running_cat.gif", rarity: "rare" }
    ],
    customs: [
      { id: 9, name: "Artist Cat", image: "/images/tmCat.png", rarity: "rare" },
      { id: 10, name: "Chef Cat", image: "/images/homeCat.png", rarity: "epic" },
      { id: 11, name: "Wizard Cat", image: "/images/running_cat.gif", rarity: "legendary" },
      { id: 12, name: "Ninja Cat", image: "/images/tmCat.png", rarity: "rare" },
      { id: 13, name: "Pirate Cat", image: "/images/homeCat.png", rarity: "epic" },
      { id: 14, name: "Space Cat", image: "/images/tmCat.png", rarity: "legendary" }
    ],
    options: [
      { id: 15, name: "Settings Cat", image: "/images/homeCat.png", rarity: "common" },
      { id: 16, name: "Help Cat", image: "/images/tmCat.png", rarity: "common" }
    ]
  };

  const categories = [
    { id: "console", name: "Gamer", icon: "🎮" },
    { id: "customs", name: "Fancy", icon: "🎨" },
    { id: "options", name: "Funny", icon: "😹" }
  ];

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common": return "#9E9E9E";
      case "rare": return "#2196F3";
      case "epic": return "#9C27B0";
      case "legendary": return "#FF9800";
      default: return "#9E9E9E";
    }
  };

  const getCollectedCount = () => {
    return Object.values(collectedCats).filter(Boolean).length;
  };

  const getTotalCount = () => {
    return Object.keys(collectedCats).length;
  };

  const getProgressPercentage = () => {
    return Math.round((getCollectedCount() / getTotalCount()) * 100);
  };

  const handleCatClick = (cat) => {
    if (collectedCats[cat.id]) {
      setScreenDisplayCat(cat); // Display cat on screen
      setSelectedCat(cat);
      setShowCatDetail(true);
    }
  };

  return (
    <div className="cat-gallery-overlay" onClick={onClose}>
      <div className="cat-gallery-modal" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button className="cat-gallery-close" onClick={onClose}>×</button>
        
        <div className="cat-gallery-content">
          {/* Left Side - Catcom with Title and Progress */}
          <div className="left-catcom-section">
            <div className="cat-gallery-header">
              <div className="header-content">
                <div className="cat-gallery-title">
                  Cat Gallery
                </div>
                <div className="progress-info">
                  <div className="progress-stats">
                    <span>Collected: {getCollectedCount()}/{getTotalCount()}</span>
                    <span>Progress: {getProgressPercentage()}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="catcom-container">
              {/* Computer Screen Background */}
              <div className="computer-screen">
                {screenDisplayCat && (
                  <img 
                    src={screenDisplayCat.image} 
                    alt={screenDisplayCat.name} 
                    className="screen-cat-image" 
                  />
                )}
                {!screenDisplayCat && (
                  <div className="screen-placeholder">
                    <span>Click a cat to display it here!</span>
                  </div>
                )}
              </div>
              {/* Catcom Image Overlay */}
              <img src="/images/catcom.png" alt="Cat Community" className="catcom-image" />
              {/* Catcom Asset with Pulse Effect */}
              <img src="/images/catcom.png" alt="Cat Asset" className="catcom-asset" />
              {/* Sparkle Foreground Effects */}
              <div className="sparkle-foreground">
                <img 
                  src="/images/catcomassets.png" 
                  alt="sparkles" 
                  className="sparkle-overlay"
                />
              </div>
            </div>
          </div>

          {/* Right Side - Grid Container with Bookmark Tabs */}
          <div className="right-grid-section">
            {/* Category Bookmark Tabs */}
            <div className="category-bookmarks">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`bookmark-tab ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="bookmark-icon">{category.icon}</span>
                  <span className="bookmark-name">{category.name}</span>
                </button>
              ))}
            </div>

            {/* Grid Container */}
            <div className="grid-container">
              <div className="cat-grid">
                {catStickers[selectedCategory].map(cat => (
                  <div 
                    key={cat.id} 
                    className={`cat-sticker ${collectedCats[cat.id] ? 'collected' : 'locked'}`}
                    style={{ borderColor: getRarityColor(cat.rarity) }}
                    onClick={() => handleCatClick(cat)}
                  >
                    {collectedCats[cat.id] ? (
                      <>
                        <img src={cat.image} alt={cat.name} className="cat-sticker-image" />
                        <div className="cat-sticker-name">{cat.name}</div>
                        <div 
                          className="rarity-badge" 
                          style={{ backgroundColor: getRarityColor(cat.rarity) }}
                        >
                          {cat.rarity}
                        </div>
                      </>
                    ) : (
                      <div className="locked-sticker">
                        <div className="lock-icon">🔒</div>
                        <div className="locked-text">???</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cat Detail Modal */}
      {showCatDetail && selectedCat && (
        <div className="cat-detail-overlay" onClick={() => setShowCatDetail(false)}>
          <div className="cat-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="cat-detail-close" onClick={() => setShowCatDetail(false)}>×</button>
            <img src={selectedCat.image} alt={selectedCat.name} className="cat-detail-image" />
            <h3 className="cat-detail-name">{selectedCat.name}</h3>
            <div 
              className="cat-detail-rarity" 
              style={{ color: getRarityColor(selectedCat.rarity) }}
            >
              {selectedCat.rarity.toUpperCase()}
            </div>
            <p className="cat-detail-description">
              This adorable {selectedCat.rarity} cat sticker was earned through your cat fact adventures! 
              Keep playing to collect more cute feline friends.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}