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
  const [resultImage, setResultImage] = useState(null);
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

  // ─── Pure client-side canvas export — no server needed ────────────────────
  const generatePoster = async () => {
    if (!thumbnailUrl) { alert('Please upload a thumbnail first.'); return; }
    setIsGenerating(true);
    try {
      const dataUrl = await generatePosterOnCanvas(thumbnailUrl, elements, aspectRatio);
      setResultImage(dataUrl);
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
      />

      <div className="main-content">
        <div className="toolbar">
          <label className="btn btn-secondary" style={{ margin: 0, cursor: 'pointer' }}>
            <Upload size={17} /> Upload Thumbnail
            <input ref={thumbRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
          <button className="btn btn-primary" onClick={generatePoster} disabled={isGenerating || !thumbnailUrl}>
            {isGenerating ? 'Rendering…' : <><Wand2 size={17} /> Generate Poster</>}
          </button>
        </div>

        <Canvas
          thumbnailUrl={thumbnailUrl}
          elements={elements}
          aspectRatio={aspectRatio}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          updateElement={updateElement}
          removeElement={removeElement}
        />
      </div>

      {resultImage && (
        <div className="result-modal" onClick={() => setResultImage(null)}>
          <div className="result-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem' }}>Generated Poster</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 12px' }} onClick={() => setResultImage(null)}>Close</button>
            </div>
            <img src={resultImage} className="result-img" alt="poster" />
            <a href={resultImage} download="poster.jpg" className="btn btn-primary" style={{ marginTop: 16, alignSelf: 'center', textDecoration: 'none' }}>
              <Download size={17} /> Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
}