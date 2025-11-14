import React, { useState, useEffect } from "react";
import "./CatGallery.css";

export default function CatGallery({ onClose }) {
  const [selectedCategory, setSelectedCategory] = useState("console");
  const [catStickers, setCatStickers] = useState({});
  const [selectedCat, setSelectedCat] = useState(null);
  const [showCatDetail, setShowCatDetail] = useState(false);
  const [screenDisplayCat, setScreenDisplayCat] = useState(null);

  const [collectedCats, _setCollectedCats] = useState({
    1: true, 2: true, 3: true, 4: true, 5: false, 6: true, 7: false, 8: false,
    9: true, 10: false, 11: true, 12: false, 13: false, 14: false, 15: true, 16: false
  });

  const categories = [
    { id: "console", name: "Players", icon: "🎮" },
    { id: "customs", name: "Collectors", icon: "🎨" },
    { id: "options", name: "Spinner", icon: "😹" }
  ];

  // Fetch cat stickers
  useEffect(() => {
    let catCategory = selectedCategory;
    if (selectedCategory === "console") catCategory = "Players";
    if (selectedCategory === "customs") catCategory = "Collectors";
    if (selectedCategory === "options") catCategory = "Spinner";

    fetch(`/api/cats/${catCategory}`)
      .then(res => res.json())
      .then(data => {
        setCatStickers(prev => ({
          ...prev,
          [selectedCategory]: data
        }));
      })
      .catch(err => console.error("Failed to load cats:", err));
  }, [selectedCategory]);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common": return "#9E9E9E";
      case "rare": return "#2196F3";
      case "epic": return "#9C27B0";
      case "legendary": return "#FF9800";
      default: return "#9E9E9E";
    }
  };

  const handleCatClick = (cat) => {
    if (collectedCats[cat.id]) {
      setScreenDisplayCat(cat);
      setSelectedCat(cat);
      setShowCatDetail(true);
    }
  };

  return (
    <div className="cat-gallery-overlay" onClick={onClose}>
      <div className="cat-gallery-modal" onClick={e => e.stopPropagation()}>
        <button className="cat-gallery-close" onClick={onClose}>×</button>
        
        <div className="cat-gallery-content">
          <div className="left-catcom-section">
            <div className="cat-gallery-header">
              <div className="header-content">
                <div className="cat-gallery-title">Cat Gallery</div>
                <div className="progress-info">
                  <div className="progress-stats">
                    <span>Collected: 0/0</span>
                    <span>Progress: 0%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="catcom-container">
              <div className="computer-screen">
                {screenDisplayCat ? (
                  <img src={screenDisplayCat.image} alt={screenDisplayCat.name} className="screen-cat-image" />
                ) : (
                  <div className="screen-placeholder">
                    <span>Click a cat to display it here!</span>
                  </div>
                )}
              </div>

              <img src="/images/catcom.png" alt="Cat Community" className="catcom-image" />
              <img src="/images/catcom.png" alt="Cat Asset" className="catcom-asset" />

              <div className="sparkle-foreground">
                <img src="/images/catcomassets.png" alt="sparkles" className="sparkle-overlay" />
              </div>
            </div>
          </div>

          <div className="right-grid-section">
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

            <div className="grid-container">
              <div className="cat-grid">
                
                {(catStickers[selectedCategory] || []).map(cat => (
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

      {showCatDetail && selectedCat && (
        <div className="cat-detail-overlay" onClick={() => setShowCatDetail(false)}>
          <div className="cat-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="cat-detail-close" onClick={() => setShowCatDetail(false)}>×</button>
            <img src={selectedCat.image} alt={selectedCat.name} className="cat-detail-image" />
            <h3 className="cat-detail-name">{selectedCat.name}</h3>
            <div className="cat-detail-rarity" style={{ color: getRarityColor(selectedCat.rarity) }}>
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
