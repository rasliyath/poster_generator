import React, { useRef, useCallback } from 'react';
import { RotateCw, X } from 'lucide-react';

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const HANDLE_POS = {
  nw: [0, 0], n: [50, 0], ne: [100, 0], e: [100, 50],
  se: [100, 100], s: [50, 100], sw: [0, 100], w: [0, 50],
};
const CURSORS = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize', e: 'e-resize',
  se: 'se-resize', s: 's-resize', sw: 'sw-resize', w: 'w-resize',
};

function getTextBgStyle(textBg) {
  if (!textBg || !textBg.enabled) return {};
  const {
    color = '#6366f1', opacity = 0.8, padding = 8,
    borderRadius = 4, style = 'solid',
  } = textBg;
  const a = Math.round(opacity * 255).toString(16).padStart(2, '0');
  const base = {
    padding: `${padding}px ${padding * 1.5}px`,
    borderRadius: `${borderRadius}px`,
    display: 'inline-block',
    maxWidth: '100%',
  };
  if (style === 'gradient')
    return { ...base, background: `linear-gradient(135deg, ${color}${a}, ${color}44)` };
  if (style === 'glassmorphism')
    return {
      ...base,
      background: `${color}${a}`,
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.2)',
    };
  if (style === 'neon')
    return {
      ...base,
      border: `2px solid ${color}`,
      boxShadow: `0 0 8px ${color}, 0 0 20px ${color}80`,
    };
  if (style === 'strip')
    return {
      ...base,
      background: `${color}${a}`,
      borderTop: `2px solid rgba(255,255,255,0.8)`,
      borderBottom: `2px solid rgba(255,255,255,0.8)`,
      borderRadius: '0px',
    };
  return { ...base, background: `${color}${a}` };
}

export default function ElementRenderer({
  element, isSelected, canvasSize,
  onSelect, onUpdate, onDelete,
}) {
  const elRef = useRef(null);
  const { x, y, w, rotation = 0 } = element;
  const h = element.h ?? element.w;
  const csw = canvasSize.w;
  const csh = canvasSize.h;

  const pxX = (x / 100) * csw;
  const pxY = (y / 100) * csh;
  const pxW = (w / 100) * csw;
  const pxH = (h / 100) * csh;
  const fontSizePx = ((element.fontSize || 5) / 100) * csw;

  // ── Drag ──
  const onDragDown = useCallback((e) => {
    if (!isSelected) { e.stopPropagation(); onSelect(); return; }
    e.stopPropagation(); e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    const ox = element.x, oy = element.y;
    const move = (ev) => onUpdate({
      x: ox + ((ev.clientX - sx) / csw) * 100,
      y: oy + ((ev.clientY - sy) / csh) * 100,
    });
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [isSelected, element.x, element.y, csw, csh, onUpdate, onSelect]);

  // ── Resize ──
  const onResizeDown = useCallback((e, pos) => {
    e.stopPropagation(); e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    const snap = {
      x: element.x, y: element.y,
      w: element.w,
      h: element.h ?? element.w,
      fontSize: element.fontSize || 5,
    };
    const move = (ev) => {
      const dx = ((ev.clientX - sx) / csw) * 100;
      const dy = ((ev.clientY - sy) / csh) * 100;
      let { x: nx, y: ny, w: nw, h: nh, fontSize: nfs } = snap;

      if (element.type === 'image') {
        if (pos.includes('e')) nw = Math.max(5, nw + dx);
        if (pos.includes('s')) nh = Math.max(3, nh + dy);
        if (pos.includes('w')) { nw = Math.max(5, nw - dx); nx += dx; }
        if (pos.includes('n')) { nh = Math.max(3, nh - dy); ny += dy; }
        onUpdate({ x: nx, y: ny, w: nw, h: nh });
      } else {
        // text: e/w change box width; n/s change font size
        if (pos.includes('e')) nw = Math.max(5, nw + dx);
        if (pos.includes('w')) { nw = Math.max(5, nw - dx); nx += dx; }
        if (pos.includes('s')) nfs = Math.max(1, nfs + dy * 0.3);
        if (pos.includes('n')) { nfs = Math.max(1, nfs - dy * 0.3); ny += dy; }
        onUpdate({ x: nx, y: ny, w: nw, fontSize: nfs });
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [element, csw, csh, onUpdate]);

  // ── Rotate ──
  const onRotateDown = useCallback((e) => {
    e.stopPropagation(); e.preventDefault();
    const rect = elRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const move = (ev) => {
      const angle =
        Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI) + 90;
      onUpdate({ rotation: angle });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [onUpdate]);

  const isNeon =
    element.type === 'text' &&
    element.textBg?.enabled &&
    element.textBg?.style === 'neon';
  const textColor = isNeon
    ? (element.textBg?.color || element.color || '#fff')
    : (element.color || '#fff');

  const isImage = element.type === 'image';

  return (
    <div
      ref={elRef}
      style={{
        position: 'absolute',
        left: pxX,
        top: pxY,
        width: pxW,
        // Images have fixed height; text grows naturally
        height: isImage ? pxH : 'auto',
        // CRITICAL: text must NOT be clipped inside the element div
        overflow: isImage ? 'hidden' : 'visible',
        transform: `rotate(${rotation}deg)`,
        // MUST be center center — canvas export also pivots around the element centre
        transformOrigin: 'center center',
        boxSizing: 'border-box',
        outline: isSelected ? '2px solid #6366f1' : '2px solid transparent',
        outlineOffset: '2px',
        cursor: 'move',
        userSelect: 'none',
        zIndex: isSelected ? 100 : 10,
      }}
      onPointerDown={onDragDown}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {element.type === 'text' ? (
        <div
          style={{
            fontSize: fontSizePx,
            fontFamily: `'${element.fontFamily || 'Outfit'}', sans-serif`,
            fontWeight: element.bold ? 700 : 400,
            fontStyle: element.italic ? 'italic' : 'normal',
            textAlign: element.textAlign || 'left',
            color: textColor,
            textShadow: element.textBg?.enabled
              ? 'none'
              : '1px 2px 6px rgba(0,0,0,0.7)',
            // Allow wrapping — match server-side behaviour
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: 1.25,
            width: '100%',
            ...getTextBgStyle(element.textBg),
          }}
        >
          {element.text}
        </div>
      ) : (
        <img
          src={element.src}
          alt={element.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            pointerEvents: 'none',
          }}
          draggable={false}
        />
      )}

      {isSelected && (
        <>
          {/* Resize handles */}
          {HANDLES.map((handle) => (
            <div
              key={handle}
              onPointerDown={(e) => onResizeDown(e, handle)}
              style={{
                position: 'absolute',
                left: `calc(${HANDLE_POS[handle][0]}% - 5px)`,
                top: `calc(${HANDLE_POS[handle][1]}% - 5px)`,
                width: 10,
                height: 10,
                background: '#fff',
                border: '2px solid #6366f1',
                borderRadius: 2,
                cursor: CURSORS[handle],
                zIndex: 200,
                touchAction: 'none',
              }}
            />
          ))}

          {/* Rotation stem */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '100%',
              width: 2,
              height: 28,
              background: '#6366f1',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          />

          {/* Rotation handle */}
          <div
            onPointerDown={onRotateDown}
            title="Rotate"
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 'calc(100% + 26px)',
              transform: 'translateX(-50%)',
              width: 24,
              height: 24,
              background: '#6366f1',
              borderRadius: '50%',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
              touchAction: 'none',
            }}
          >
            <RotateCw size={13} color="#fff" />
          </div>

          {/* Delete button */}
          <div
            onPointerDown={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete"
            style={{
              position: 'absolute',
              right: -12,
              top: -12,
              width: 22,
              height: 22,
              background: '#ef4444',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
            }}
          >
            <X size={12} color="#fff" />
          </div>
        </>
      )}
    </div>
  );
}