import React, { useState, useRef } from 'react';
import { Upload, Download, Wand2, Tv, Monitor, Smartphone, Tablet } from 'lucide-react';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';
import { generatePosterOnCanvas } from './posterExport';
import './index.css';

let _id = 0;
const uid = () => `el_${Date.now()}_${_id++}`;

const DEFAULT_ELEMENTS = [
  {
    id: uid(), type: 'text', name: 'Title',
    x: 8, y: 35, w: 55, rotation: 0,
    text: 'SUMMER VIBES',
    fontFamily: 'Outfit', fontSize: 7, color: '#ffffff',
    bold: true, italic: false, textAlign: 'left',
    textBg: { enabled: false, color: '#6366f1', opacity: 0.8, padding: 8, borderRadius: 4, style: 'solid' },
  },
  {
    id: uid(), type: 'text', name: 'Date',
    x: 8, y: 55, w: 35, rotation: 0,
    text: '20.08.2026',
    fontFamily: 'Outfit', fontSize: 3.5, color: '#94a3b8',
    bold: false, italic: false, textAlign: 'left',
    textBg: { enabled: false, color: '#334155', opacity: 0.85, padding: 6, borderRadius: 20, style: 'solid' },
  },
];

// ─── Device configs ────────────────────────────────────────────────────────────
// Each device shows the SAME image — CSS object-fit:cover handles the crop
const DEVICES = [
  {
    id: 'tv',
    label: 'TV',
    Icon: Tv,
    desc: '16:9 · 4K Television',
    // outer frame dimensions (display units)
    frameW: 520,
    frameH: 310,
    // screen inset inside the bezel
    screenPadT: 14, screenPadR: 14, screenPadB: 32, screenPadL: 14,
    screenRadius: 4,
    frameRadius: 16,
    frameColor: '#1a1d27',
    borderColor: '#2d3148',
    // stand
    stand: true,
  },
  {
    id: 'desktop',
    label: 'Desktop',
    Icon: Monitor,
    desc: '16:9 · 1920×1080',
    frameW: 420,
    frameH: 270,
    screenPadT: 10, screenPadR: 10, screenPadB: 28, screenPadL: 10,
    screenRadius: 4,
    frameRadius: 10,
    frameColor: '#1a1d27',
    borderColor: '#2d3148',
    stand: true,
  },
  {
    id: 'mobile',
    label: 'Mobile',
    Icon: Smartphone,
    desc: '9:16 · Portrait',
    frameW: 160,
    frameH: 320,
    screenPadT: 18, screenPadR: 10, screenPadB: 22, screenPadL: 10,
    screenRadius: 10,
    frameRadius: 28,
    frameColor: '#1a1d27',
    borderColor: '#2d3148',
    stand: false,
    notch: true,
  },
  {
    id: 'tablet',
    label: 'Tablet',
    Icon: Tablet,
    desc: '4:3 · iPad landscape',
    frameW: 340,
    frameH: 260,
    screenPadT: 16, screenPadR: 24, screenPadB: 16, screenPadL: 24,
    screenRadius: 6,
    frameRadius: 18,
    frameColor: '#1a1d27',
    borderColor: '#2d3148',
    stand: false,
    homeButton: true,
  },
];

// ─── DeviceMockup ──────────────────────────────────────────────────────────────
function DeviceMockup({ device, imageUrl, isActive, onClick }) {
  const { frameW, frameH, screenPadT, screenPadR, screenPadB, screenPadL,
    screenRadius, frameRadius, frameColor, borderColor, stand, notch, homeButton, label, Icon, desc } = device;

  const screenW = frameW - screenPadL - screenPadR;
  const screenH = frameH - screenPadT - screenPadB;

  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '16px 20px',
        borderRadius: 16,
        transition: 'all 0.2s',
        outline: 'none',
        opacity: isActive ? 1 : 0.55,
        transform: isActive ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      {/* Device frame */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Frame shell */}
        <div style={{
          width: frameW,
          height: frameH,
          background: frameColor,
          borderRadius: frameRadius,
          border: `2px solid ${isActive ? '#6366f1' : borderColor}`,
          boxShadow: isActive
            ? '0 0 0 3px rgba(99,102,241,0.25), 0 20px 60px rgba(0,0,0,0.6)'
            : '0 8px 32px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}>
          {/* Notch (mobile) */}
          {notch && (
            <div style={{
              position: 'absolute',
              top: 4, left: '50%',
              transform: 'translateX(-50%)',
              width: 40, height: 8,
              background: '#0d0f16',
              borderRadius: 8,
              zIndex: 10,
            }} />
          )}

          {/* Screen */}
          <div style={{
            position: 'absolute',
            top: screenPadT,
            right: screenPadR,
            bottom: screenPadB,
            left: screenPadL,
            borderRadius: screenRadius,
            overflow: 'hidden',
            background: '#000',
          }}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${label} preview`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',    // ← full image visible, letterboxed like a real TV
                  objectPosition: 'center center',
                  display: 'block',
                  background: '#000',
                }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-secondary)',
                color: 'var(--text-muted)',
                fontSize: '0.7rem',
              }}>
                No image
              </div>
            )}
          </div>

          {/* Status bar tint (TV/Desktop) */}
          {stand && (
            <div style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: screenPadB,
              background: frameColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* Camera dot */}
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: borderColor }} />
            </div>
          )}

          {/* Home button (tablet) */}
          {homeButton && (
            <>
              <div style={{
                position: 'absolute',
                bottom: screenPadB / 2 - 6,
                right: screenPadR / 2 - 6,
                width: 12, height: 12,
                borderRadius: '50%',
                border: `1.5px solid ${borderColor}`,
              }} />
            </>
          )}
        </div>

        {/* Stand (TV/Desktop) */}
        {stand && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: frameW * 0.14,
              height: 14,
              background: frameColor,
              borderLeft: `2px solid ${borderColor}`,
              borderRight: `2px solid ${borderColor}`,
            }} />
            <div style={{
              width: frameW * 0.32,
              height: 6,
              background: frameColor,
              borderRadius: '0 0 8px 8px',
              border: `2px solid ${borderColor}`,
              borderTop: 'none',
            }} />
          </div>
        )}
      </div>

      {/* Label */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isActive ? 'var(--text-main)' : 'var(--text-muted)', transition: 'color 0.2s' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
          {desc}
        </div>
      </div>
    </button>
  );
}

// ─── DevicePreviewModal ────────────────────────────────────────────────────────
function DevicePreviewModal({ imageUrl, onClose, onEdit }) {
  const [activeDevice, setActiveDevice] = useState('tv');

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(20px)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-panel)',
          borderRadius: 24,
          border: '1px solid var(--border-color)',
          padding: '28px 32px',
          maxWidth: '95vw',
          maxHeight: '92vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 4 }}>
              Responsive Preview
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 420 }}>
              One image · fully visible on every screen. The poster scales to fit each device —
              letterboxed just like a TV — so no content is ever cropped.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 14px', flexShrink: 0 }}
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Device row */}
        <div style={{
          display: 'flex',
          gap: 0,
          alignItems: 'flex-end',
          justifyContent: 'center',
          flexWrap: 'wrap',
          overflowX: 'auto',
          paddingBottom: 8,
        }}>
          {DEVICES.map((d) => (
            <DeviceMockup
              key={d.id}
              device={d}
              imageUrl={imageUrl}
              isActive={activeDevice === d.id}
              onClick={() => setActiveDevice(d.id)}
            />
          ))}
        </div>

        {/* Active device info bar */}
        <div style={{
          background: 'var(--bg-dark)',
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          {(() => {
            const d = DEVICES.find((x) => x.id === activeDevice);
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <d.Icon size={18} style={{ color: 'var(--accent-color)' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{d.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.desc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                    object-fit: contain
                  </span>
                  <span>Full image visible · letterboxed like TV</span>
                </div>
              </>
            );
          })()}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={imageUrl}
            download="poster.jpg"
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <Download size={16} /> Download Poster
          </a>
          {onEdit && (
            <button className="btn btn-secondary" onClick={onEdit}>
              Edit in Canvas
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [elements, setElements] = useState(DEFAULT_ELEMENTS);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [selectedId, setSelectedId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [overlay, setOverlay] = useState({ enabled: false, color: '#000000', opacity: 0.5 });

  // Single result image — same image shown across all device previews
  const [resultImage, setResultImage] = useState(null);

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('poster_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [view, setView] = useState('editor');
  const [galleryFilter, setGalleryFilter] = useState('all');
  const [previewItem, setPreviewItem] = useState(null);
  const thumbRef = useRef(null);

  const updateElement = (id, changes) =>
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...changes } : el)));

  const removeElement = (id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  };

  const addText = (type) => {
    const count = elements.filter(
      (e) => e.type === 'text' && e.name.startsWith(type === 'title' ? 'Title' : 'Subtitle'),
    ).length;
    const id = uid();
    const el = {
      id, type: 'text',
      name: type === 'title' ? `Title ${count + 1}` : `Subtitle ${count + 1}`,
      x: 10, y: 20 + count * 15, w: 55, rotation: 0,
      text: type === 'title' ? 'YOUR TITLE' : 'Your subtitle text',
      fontFamily: 'Outfit',
      fontSize: type === 'title' ? 7 : 4,
      color: '#ffffff',
      bold: type === 'title',
      italic: false, textAlign: 'left',
      textBg: { enabled: false, color: '#6366f1', opacity: 0.8, padding: 8, borderRadius: 4, style: 'solid' },
    };
    setElements((prev) => [...prev, el]);
    setSelectedId(id);
  };

  const addImage = (src, name) => {
    const id = uid();
    const el = { id, type: 'image', name: name || 'Icon', x: 80, y: 4, w: 14, h: 14, rotation: 0, src };
    setElements((prev) => [...prev, el]);
    setSelectedId(id);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setThumbnailUrl(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const loadPoster = (item) => {
    if (!item.config) return;
    setThumbnailUrl(item.config.thumbnailUrl);
    setElements(item.config.elements);
    setAspectRatio(item.config.aspectRatio);
    setOverlay(item.config.overlay || { enabled: false, color: '#000000', opacity: 0.5 });
    setPreviewItem(null);
    setResultImage(null);
    setView('editor');
  };

  // ── Generate ONE high-res poster ───────────────────────────────────────────
  const generatePoster = async () => {
    if (!thumbnailUrl) { alert('Please upload a thumbnail first.'); return; }
    setIsGenerating(true);
    try {
      // Export at the designer's chosen aspect ratio — high quality single image
      const dataUrl = await generatePosterOnCanvas(thumbnailUrl, elements, aspectRatio, overlay);
      setResultImage(dataUrl);

      const item = {
        id: Date.now(),
        previewUrl: dataUrl,
        config: { thumbnailUrl, elements: JSON.parse(JSON.stringify(elements)), overlay, aspectRatio },
      };

      const newHistory = [item, ...history].slice(0, 12);
      setHistory(newHistory);
      try { localStorage.setItem('poster_history', JSON.stringify(newHistory)); } catch { /* quota */ }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to generate poster: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        elements={elements}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        addText={addText}
        addImage={addImage}
        updateElement={updateElement}
        removeElement={removeElement}
        overlay={overlay}
        setOverlay={setOverlay}
      />

      <div className="main-content">
        {/* Toolbar */}
        <div className="toolbar">
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className={`btn ${view === 'editor' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView('editor')}
            >
              Editor
            </button>
            <button
              className={`btn ${view === 'gallery' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView('gallery')}
            >
              Gallery ({history.length})
            </button>
          </div>

          {view === 'editor' && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Aspect ratio badge (read-only reminder) */}
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                padding: '4px 10px',
                borderRadius: 6,
                letterSpacing: '0.05em',
              }}>
                {aspectRatio}
              </span>
              <label className="btn btn-secondary" style={{ margin: 0, cursor: 'pointer' }}>
                <Upload size={17} /> Upload Thumbnail
                <input ref={thumbRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
              </label>
              <button
                className="btn btn-primary"
                onClick={generatePoster}
                disabled={isGenerating || !thumbnailUrl}
              >
                {isGenerating
                  ? (<><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginRight: 6 }} />Rendering…</>)
                  : (<><Wand2 size={17} /> Generate Poster</>)
                }
              </button>
            </div>
          )}
        </div>

        {/* Main area */}
        {view === 'editor' ? (
          <Canvas
            thumbnailUrl={thumbnailUrl}
            elements={elements}
            aspectRatio={aspectRatio}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            updateElement={updateElement}
            removeElement={removeElement}
            overlay={overlay}
          />
        ) : (
          /* ── Gallery ── */
          <div className="gallery-container">
            <div className="gallery-header">
              <div style={{ display: 'flex', gap: 8 }}>
                {['all', '16:9', '9:16', '1:1'].map((f) => (
                  <button
                    key={f}
                    className={`btn ${galleryFilter === f ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', textTransform: 'uppercase' }}
                    onClick={() => setGalleryFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Click a poster to preview on all devices
              </p>
            </div>

            {history.filter(
              (h) => galleryFilter === 'all' || (h.config?.aspectRatio || '16:9') === galleryFilter,
            ).length === 0 ? (
              <div className="canvas-placeholder" style={{ height: '300px' }}>
                <p style={{ opacity: 0.5 }}>No posters found</p>
              </div>
            ) : (
              <div className="gallery-grid">
                {history
                  .filter((h) => galleryFilter === 'all' || (h.config?.aspectRatio || '16:9') === galleryFilter)
                  .map((item, i) => {
                    const url = item.previewUrl || (typeof item === 'string' ? item : item.url);
                    const ratio = item.config?.aspectRatio || '16:9';
                    return (
                      <div key={item.id || i} className={`gallery-item ratio-${ratio.replace(':', '-')}`}>
                        <img src={url} alt={`poster-${i}`} />
                        <div className="gallery-item-overlay">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', width: '100%', padding: '0 12px' }}>
                            <button
                              className="btn btn-primary"
                              style={{ width: '100%', padding: '7px' }}
                              onClick={() => setPreviewItem(item)}
                            >
                              <Tv size={14} /> Preview on Devices
                            </button>
                            {item.config && (
                              <button
                                className="btn btn-secondary"
                                style={{ width: '100%', padding: '7px', fontSize: '0.75rem' }}
                                onClick={() => loadPoster(item)}
                              >
                                Edit Poster
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="ratio-tag">{ratio}</div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Device Preview Modal (from gallery) ── */}
      {previewItem && (
        <DevicePreviewModal
          imageUrl={previewItem.previewUrl || (typeof previewItem === 'string' ? previewItem : previewItem.url)}
          onClose={() => setPreviewItem(null)}
          onEdit={previewItem.config ? () => loadPoster(previewItem) : undefined}
        />
      )}

      {/* ── Result modal (immediately after generation) ── */}
      {resultImage && !previewItem && (
        <DevicePreviewModal
          imageUrl={resultImage}
          onClose={() => setResultImage(null)}
          onEdit={null}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}