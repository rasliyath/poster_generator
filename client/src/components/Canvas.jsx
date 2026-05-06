import React, { useRef, useEffect, useState } from 'react';
import ElementRenderer from './ElementRenderer';

const RATIOS = { '16:9': 16/9, '9:16': 9/16, '1:1': 1 };

export default function Canvas({ thumbnailUrl, elements, aspectRatio, selectedId, setSelectedId, updateElement, removeElement, overlay }) {
  const areaRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 450 });

  useEffect(() => {
    if (!areaRef.current) return;
    const compute = () => {
      const { clientWidth: cw, clientHeight: ch } = areaRef.current;
      const pad = 60;
      const maxW = cw - pad;
      const maxH = ch - pad;
      const ratio = RATIOS[aspectRatio] || (16/9);
      let w = maxW, h = w / ratio;
      if (h > maxH) { h = maxH; w = h * ratio; }
      setCanvasSize({ w: Math.round(w), h: Math.round(h) });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(areaRef.current);
    return () => ro.disconnect();
  }, [aspectRatio]);

  return (
    <div
      ref={areaRef}
      className="canvas-area"
      onClick={() => setSelectedId(null)}
      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
    >
      <div
        className="canvas-wrapper"
        style={{ width: canvasSize.w, height: canvasSize.h, position: 'relative', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background */}
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', background: '#000', display: 'block' }}
            alt="Background"
            draggable={false}
          />
        ) : (
          <div className="canvas-placeholder">
            <p style={{ opacity: 0.5 }}>Upload a thumbnail to begin</p>
          </div>
        )}
        
        {/* Global Overlay */}
        {overlay?.enabled && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(to bottom, transparent, ${overlay.color})`,
              opacity: overlay.opacity,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />
        )}

        {/* Elements */}
        {elements.map((el) => (
          <ElementRenderer
            key={el.id}
            element={el}
            isSelected={selectedId === el.id}
            canvasSize={canvasSize}
            onSelect={() => setSelectedId(el.id)}
            onUpdate={(changes) => updateElement(el.id, changes)}
            onDelete={() => removeElement(el.id)}
          />
        ))}
      </div>
    </div>
  );
}
