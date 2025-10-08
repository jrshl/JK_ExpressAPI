import React, { useEffect, useMemo, useState } from "react";
import "./CatCursor.css";

/**
 * CatCursor
 * - Hides the native cursor and shows a bottom-anchored cat paw that reaches toward the mouse X/Y.
 * - The paw image scales with the container height (no visible cuts). Adjust width/offsets in CSS.
 * - Disabled automatically on coarse pointers (touch devices).
 */
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
  const [height, setHeight] = useState(1000); // start with a safe guess; refined after image loads
  const [pressed, setPressed] = useState(false);
  const [hasClickImage, setHasClickImage] = useState(true); // assume present; will auto-disable if missing

  // Hotspot (in the source image pixel space)
  const HOTSPOT_PX_X = 256; // given: 512/2
  const HOTSPOT_PX_Y = 20;  // given
  // Pixel fine-tune after scaling (screen px)
  // X: positive moves image RIGHT (tip appears right of cursor), negative moves LEFT
  // Y: positive moves image UP (tip appears above cursor), negative moves DOWN
  const PIXEL_OFFSET_X = -240; // move left by 200px
  const PIXEL_OFFSET_Y = 155;  // lower than before (was 520) so the tip sits below previous position
  const FIXED_WIDTH = 500; // px, always keep the paw this wide

  // dynamic vertical placement (CSS bottom value in px)
  const [bottom, setBottom] = useState(-10);
  // hotspot as fractions (0..1) of the scaled element
  const [tipFracX, setTipFracX] = useState(0.5);
  const [tipFracY, setTipFracY] = useState(0.05);
  const [debugHotspot, setDebugHotspot] = useState(() => {
    try {
      return localStorage.getItem('catCursorDebug') === '1';
    } catch { return false; }
  });

  useEffect(() => {
    if (!active) return;

    // Preload images and detect intrinsic ratio + click-state
    const restImg = new Image();
    restImg.onload = () => {
      // compute height for fixed width
      const ratio = restImg.naturalHeight && restImg.naturalWidth
        ? restImg.naturalHeight / restImg.naturalWidth
        : 2.0; // fallback guess
      setHeight(Math.round(ratio * FIXED_WIDTH));
      // compute hotspot fractions ignoring transparent margins
      if (restImg.naturalWidth && restImg.naturalHeight) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = restImg.naturalWidth;
          canvas.height = restImg.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(restImg, 0, 0);
          const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const alphaAt = (x, y) => data[(y * width + x) * 4 + 3];
          const threshold = 10; // alpha > 10 is considered visible
          let top = 0, bottom = height - 1, left = 0, right = width - 1;
          // top
          topSearch: for (; top < height; top++) {
            for (let x = 0; x < width; x += 2) { // step 2px for speed
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
          // convert hotspot to trimmed fractions
          const fx = Math.min(1, Math.max(0, (HOTSPOT_PX_X - left) / effW));
          const fy = Math.min(1, Math.max(0, (HOTSPOT_PX_Y - top) / effH));
          setTipFracX(fx);
          setTipFracY(fy);
        } catch {
          // fallback to natural fractions if canvas is blocked for some reason
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
      if (!h) return -10; // until image loads
      const distanceFromViewportBottom = (window.innerHeight - clientY);
      const tipOffsetFromTop = tipFracY * h;
      // bottom equals distance needed so bottom + (h - tipOffset) matches distanceFromViewportBottom
      return distanceFromViewportBottom - (h - tipOffsetFromTop) + PIXEL_OFFSET_Y;
    };

    const onMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      setPos({ x, y });
      // cache for initial placement on mount
      window.__lastMouseY = y;
      // Keep size constant; move vertically by adjusting `bottom` so the tip aligns with the cursor.
    setBottom(computeBottomFor(y, height));
      // subtle tilt based on horizontal velocity
      const nextTilt = Math.max(-12, Math.min(12, (e.movementX || 0) / 4));
      setTilt(nextTilt);
    };

    const onMouseDown = () => setPressed(true);
    const onMouseUp = () => setPressed(false);
    const onKeyDown = (e) => {
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        setDebugHotspot(prev => {
          const next = !prev;
          try { localStorage.setItem('catCursorDebug', next ? '1' : '0'); }
          catch (err) { /* non-fatal */ console.warn('catCursorDebug persist failed:', err); }
          return next;
        });
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    document.documentElement.classList.add("hide-native-cursor");

    // Initialize vertical position for the current mouse position if available
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

  if (!active) return null;

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
