import React, { useState, useRef } from 'react';
import { Upload, Download, Wand2 } from 'lucide-react';
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

export default function App() {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [elements, setElements] = useState(DEFAULT_ELEMENTS);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [selectedId, setSelectedId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [overlay, setOverlay] = useState({ enabled: false, color: '#000000', opacity: 0.5 });
  const [resultImage, setResultImage] = useState(null);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('poster_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [view, setView] = useState('editor'); // 'editor' | 'gallery'
  const [galleryFilter, setGalleryFilter] = useState('all');
  const thumbRef = useRef(null);

  const updateElement = (id, changes) =>
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...changes } : el));

  const removeElement = (id) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedId(prev => prev === id ? null : prev);
  };

  const addText = (type) => {
    const count = elements.filter(e => e.type === 'text' && e.name.startsWith(type === 'title' ? 'Title' : 'Subtitle')).length;
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
    setElements(prev => [...prev, el]);
    setSelectedId(id);
  };

  const addImage = (src, name) => {
    const id = uid();
    const el = { id, type: 'image', name: name || 'Icon', x: 80, y: 4, w: 14, h: 14, rotation: 0, src };
    setElements(prev => [...prev, el]);
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
    setView('editor');
  };

  const downloadFormat = async (item, ratio) => {
    if (!item.config) return;
    setIsGenerating(true);
    try {
      const dataUrl = await generatePosterOnCanvas(
        item.config.thumbnailUrl, 
        item.config.elements, 
        ratio, 
        item.config.overlay
      );
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `poster-${ratio.replace(':', '-')}.jpg`;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to generate format: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Pure client-side canvas export — no server needed ────────────────────
  const generatePoster = async () => {
    if (!thumbnailUrl) { alert('Please upload a thumbnail first.'); return; }
    setIsGenerating(true);
    try {
      const dataUrl = await generatePosterOnCanvas(thumbnailUrl, elements, aspectRatio, overlay);
      setResultImage(dataUrl);
      
      const item = { 
        id: Date.now(), 
        previewUrl: dataUrl, // Small preview for gallery
        config: { thumbnailUrl, elements, overlay, aspectRatio } 
      };
      
      const newHistory = [item, ...history].slice(0, 12); // Reduced count to stay within localStorage limits
      setHistory(newHistory);
      localStorage.setItem('poster_history', JSON.stringify(newHistory));
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
        <div className="toolbar">
          <div style={{ display: 'flex', gap: 12 }}>
            <button className={`btn ${view === 'editor' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('editor')}>
              Editor
            </button>
            <button className={`btn ${view === 'gallery' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('gallery')}>
              Gallery ({history.length})
            </button>
          </div>
          
          {view === 'editor' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <label className="btn btn-secondary" style={{ margin: 0, cursor: 'pointer' }}>
                <Upload size={17} /> Upload Thumbnail
                <input ref={thumbRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
              </label>
              <button className="btn btn-primary" onClick={generatePoster} disabled={isGenerating || !thumbnailUrl}>
                {isGenerating ? 'Rendering…' : <><Wand2 size={17} /> Generate Poster</>}
              </button>
            </div>
          )}
        </div>

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
          <div className="gallery-container">
            <div className="gallery-header">
              <div style={{ display: 'flex', gap: 8 }}>
                {['all', '16:9', '9:16', '1:1'].map(f => (
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
                Showing {galleryFilter === 'all' ? 'All' : galleryFilter} Posters
              </p>
            </div>

            {history.filter(h => galleryFilter === 'all' || (h.ratio || '16:9') === galleryFilter).length === 0 ? (
              <div className="canvas-placeholder" style={{ height: '300px' }}>
                <p style={{ opacity: 0.5 }}>No posters found for this format</p>
              </div>
            ) : (
              <div className="gallery-grid">
                {history
                  .filter(h => galleryFilter === 'all' || (h.config?.aspectRatio || h.ratio || '16:9') === galleryFilter)
                  .map((item, i) => {
                    const isOld = typeof item === 'string' || !item.config;
                    const url = isOld ? (typeof item === 'string' ? item : item.url) : item.previewUrl;
                    const ratio = isOld ? (typeof item === 'string' ? '16:9' : (item.ratio || '16:9')) : item.config.aspectRatio;
                    
                    return (
                      <div key={item.id || i} className={`gallery-item ratio-${ratio.replace(':', '-')}`}>
                        <img src={url} alt={`poster-${i}`} />
                        <div className="gallery-item-overlay">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', width: '100%', padding: '0 12px' }}>
                            <button className="btn btn-primary" style={{ width: '100%', padding: '6px' }} onClick={() => setResultImage(url)}>
                              Preview
                            </button>
                            {!isOld && (
                              <>
                                <button className="btn btn-secondary" style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }} onClick={() => loadPoster(item)}>
                                  Edit Poster
                                </button>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, width: '100%', marginTop: 4 }}>
                                  {['16:9', '9:16', '1:1'].map(r => (
                                    <button 
                                      key={r} 
                                      className="btn btn-secondary" 
                                      style={{ padding: '4px 0', fontSize: '0.65rem' }}
                                      onClick={() => downloadFormat(item, r)}
                                      title={`Download ${r}`}
                                    >
                                      {r}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                            {isOld && (
                              <a href={url} download={`poster-${i}.jpg`} className="btn btn-secondary" style={{ width: '100%', padding: '6px' }}>
                                Download
                              </a>
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

      {resultImage && (
        <div className="result-modal" onClick={() => setResultImage(null)}>
          <div className="result-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem' }}>Generated Poster</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 12px' }} onClick={() => setResultImage(null)}>Close</button>
            </div>
            <img src={resultImage} className="result-img" alt="poster" />
            <div style={{ display: 'flex', gap: 12, marginTop: 16, alignSelf: 'center' }}>
              <a href={resultImage} download="poster.jpg" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                <Download size={17} /> Download
              </a>
              <button className="btn btn-secondary" onClick={() => { setView('gallery'); setResultImage(null); }}>
                Go to Gallery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}