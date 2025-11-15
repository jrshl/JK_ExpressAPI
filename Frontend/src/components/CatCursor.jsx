import React, { useEffect, useMemo, useState } from "react";
import "./CatCursor.css";

export default function CatCursor({ enabled = true }) {
  const isCoarse = useMemo(() =>
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches,
  []);

  const active = enabled && !isCoarse;

  const [pos, setPos] = useState(() => ({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight - 1 : 0,
  }));
  const [tilt, setTilt] = useState(0);
  const [height, setHeight] = useState(1000); 
  const [pressed, setPressed] = useState(false);
  const [hasClickImage, setHasClickImage] = useState(true); 

  // Hotspot 
  const HOTSPOT_PX_X = 256; 
  const HOTSPOT_PX_Y = 20;  
  const PIXEL_OFFSET_X = -240; 
  const PIXEL_OFFSET_Y = 155;
  const FIXED_WIDTH = 500;
  const [bottom, setBottom] = useState(-10);
  const [tipFracX, setTipFracX] = useState(0.5);
  const [tipFracY, setTipFracY] = useState(0.05);
  const [debugHotspot, setDebugHotspot] = useState(() => {
    try {
      return localStorage.getItem('catCursorDebug') === '1';
    } catch { return false; }
  });
  const [isOverModal, setIsOverModal] = useState(false);

  useEffect(() => {
    if (!active) return;

    const restImg = new Image();
    restImg.onload = () => {
      const ratio = restImg.naturalHeight && restImg.naturalWidth
        ? restImg.naturalHeight / restImg.naturalWidth
        : 2.0;
      setHeight(Math.round(ratio * FIXED_WIDTH));
      if (restImg.naturalWidth && restImg.naturalHeight) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = restImg.naturalWidth;
          canvas.height = restImg.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(restImg, 0, 0);
          const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const alphaAt = (x, y) => data[(y * width + x) * 4 + 3];
          const threshold = 10; 
          let top = 0, bottom = height - 1, left = 0, right = width - 1;
          // top
          topSearch: for (; top < height; top++) {
            for (let x = 0; x < width; x += 2) { 
              if (alphaAt(x, top) > threshold) break topSearch;
            }
          }
          // bottom
          bottomSearch: for (; bottom >= 0; bottom--) {
            for (let x = 0; x < width; x += 2) {
              if (alphaAt(x, bottom) > threshold) break bottomSearch;
            }
          }
          // left
          leftSearch: for (; left < width; left++) {
            for (let y = top; y <= bottom; y += 2) {
              if (alphaAt(left, y) > threshold) break leftSearch;
            }
          }
          // right
          rightSearch: for (; right >= 0; right--) {
            for (let y = top; y <= bottom; y += 2) {
              if (alphaAt(right, y) > threshold) break rightSearch;
            }
          }
          // guard
          top = Math.max(0, Math.min(top, height - 1));
          bottom = Math.max(0, Math.min(bottom, height - 1));
          left = Math.max(0, Math.min(left, width - 1));
          right = Math.max(0, Math.min(right, width - 1));
          const effW = Math.max(1, width - left - (width - 1 - right));
          const effH = Math.max(1, height - top - (height - 1 - bottom));
          const fx = Math.min(1, Math.max(0, (HOTSPOT_PX_X - left) / effW));
          const fy = Math.min(1, Math.max(0, (HOTSPOT_PX_Y - top) / effH));
          setTipFracX(fx);
          setTipFracY(fy);
        } catch {
          const fx = Math.min(1, Math.max(0, HOTSPOT_PX_X / restImg.naturalWidth));
          const fy = Math.min(1, Math.max(0, HOTSPOT_PX_Y / restImg.naturalHeight));
          setTipFracX(fx);
          setTipFracY(fy);
        }
      }
    };
    restImg.src = "/images/pawrest.png";
    const clickImg = new Image();
    clickImg.onload = () => setHasClickImage(true);
    clickImg.onerror = () => setHasClickImage(false);
    clickImg.src = "/images/pawclick.png";

    const computeBottomFor = (clientY, h) => {
      if (!h) return -10; 
      const distanceFromViewportBottom = (window.innerHeight - clientY);
      const tipOffsetFromTop = tipFracY * h;
      return distanceFromViewportBottom - (h - tipOffsetFromTop) + PIXEL_OFFSET_Y;
    };

    const onMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      setPos({ x, y });
      window.__lastMouseY = y;
    setBottom(computeBottomFor(y, height));
      const nextTilt = Math.max(-12, Math.min(12, (e.movementX || 0) / 4));
      setTilt(nextTilt);
      
      // check if cursor is over the login modal
      const target = e.target;
      const isModal = target.closest('.modal-box, .auth-loader-overlay, .success-modal-overlay, .page-loader');
      setIsOverModal(!!isModal);
    };

    const onMouseDown = () => setPressed(true);
    const onMouseUp = () => setPressed(false);
    const onKeyDown = (e) => {
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        setDebugHotspot(prev => {
          const next = !prev;
          try { localStorage.setItem('catCursorDebug', next ? '1' : '0'); }
          catch (err) {console.warn('catCursorDebug persist failed:', err); }
          return next;
        });
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    document.documentElement.classList.add("hide-native-cursor");

    const initialY = typeof window !== "undefined" ? (window.__lastMouseY || (window.innerHeight - 1)) : 0;
    setBottom(computeBottomFor(initialY, height));
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("keydown", onKeyDown);
      document.documentElement.classList.remove("hide-native-cursor");
    };
  }, [active, height, tipFracY]);

  if (!active || isOverModal) return null;

  return (
    <div
      className="cat-cursor"
      style={{ left: pos.x + PIXEL_OFFSET_X, height, bottom }}
      aria-hidden="true"
    >
      <div
        className={`cat-cursor-img${pressed && hasClickImage ? " pressed" : ""}`}
        style={{
          transform: `translate(${-tipFracX * 100}%, 0) rotate(${tilt}deg) scale(${pressed ? 1.05 : 1})`,
          transformOrigin: `${tipFracX * 100}% ${tipFracY * 100}%`,
        }}
      />
      {debugHotspot && (
        <div
          className="cat-cursor-hotspot"
          style={{ left: `${tipFracX * 100}%`, top: `${tipFracY * 100}%` }}
        />
      )}
    </div>
  );
}