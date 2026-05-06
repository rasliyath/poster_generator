import React, { useRef } from 'react';
import { Type, Image as ImgIcon, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Monitor, Smartphone, Square, Plus, Trash2 } from 'lucide-react';

const FONTS = ['Outfit', 'Roboto', 'Playfair Display', 'Montserrat', 'Oswald'];
const BG_STYLES = ['solid', 'gradient', 'glassmorphism', 'neon'];

export default function Sidebar({ elements, selectedId, setSelectedId, aspectRatio, setAspectRatio, addText, addImage, updateElement, removeElement }) {
  const fileRef = useRef(null);
  const selectedEl = elements.find(e => e.id === selectedId);

  const upd = (changes) => updateElement(selectedId, changes);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PosterAI</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>Drag · Resize · Rotate</p>
      </div>

      <div className="sidebar-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Aspect Ratio */}
        <div>
          <div className="input-label" style={{ marginBottom: 8 }}>Canvas Format</div>
          <div className="aspect-selector">
            {[['16:9', Monitor], ['9:16', Smartphone], ['1:1', Square]].map(([r, Icon]) => (
              <button key={r} className={`btn aspect-btn ${aspectRatio === r ? 'active' : ''}`} onClick={() => setAspectRatio(r)}>
                <Icon size={14} /><span>{r}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Add Elements */}
        <div>
          <div className="input-label" style={{ marginBottom: 8 }}>Add Elements</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => addText('title')} style={{ justifyContent: 'flex-start' }}>
              <Plus size={16} /><Type size={16} /> Add Title
            </button>
            <button className="btn btn-secondary" onClick={() => addText('subtitle')} style={{ justifyContent: 'flex-start' }}>
              <Plus size={16} /><Type size={14} /> Add Subtitle
            </button>
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} style={{ justifyContent: 'flex-start' }}>
              <Plus size={16} /><ImgIcon size={16} /> Upload Icon / Image
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
              const f = e.target.files[0]; if (!f) return;
              const reader = new FileReader();
              reader.onload = (ev) => addImage(ev.target.result, f.name);
              reader.readAsDataURL(f);
              e.target.value = '';
            }} />
          </div>
        </div>

        {/* Elements List */}
        {elements.length > 0 && (
          <div>
            <div className="input-label" style={{ marginBottom: 8 }}>Layers</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...elements].reverse().map(el => (
                <div
                  key={el.id}
                  className={`element-item ${selectedId === el.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(el.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    {el.type === 'text' ? <Type size={15} /> : <ImgIcon size={15} />}
                    <span style={{ fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {el.type === 'text' ? el.text.slice(0, 20) : el.name}
                    </span>
                  </div>
                  <button className="btn btn-danger" style={{ padding: '4px', minWidth: 28, height: 28 }}
                    onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Properties */}
        {selectedEl && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
            <div className="input-label" style={{ marginBottom: 14 }}>Properties — {selectedEl.name}</div>

            {selectedEl.type === 'text' && (
              <>
                <div className="input-group">
                  <label className="input-label">Text</label>
                  <textarea
                    rows={2}
                    value={selectedEl.text}
                    onChange={(e) => upd({ text: e.target.value })}
                    style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: 8, padding: '8px 12px', fontFamily: 'inherit', resize: 'vertical', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Font</label>
                  <select value={selectedEl.fontFamily || 'Outfit'} onChange={(e) => upd({ fontFamily: e.target.value })}>
                    {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Font Size (% of width)</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="range" min={1} max={20} step={0.1} value={selectedEl.fontSize || 5}
                      onChange={(e) => upd({ fontSize: parseFloat(e.target.value) })}
                      style={{ flex: 1 }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', minWidth: 30 }}>{(selectedEl.fontSize || 5).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Style</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className={`btn ${selectedEl.bold ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '8px' }} onClick={() => upd({ bold: !selectedEl.bold })}>
                      <Bold size={15} />
                    </button>
                    <button className={`btn ${selectedEl.italic ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '8px' }} onClick={() => upd({ italic: !selectedEl.italic })}>
                      <Italic size={15} />
                    </button>
                    <button className={`btn ${selectedEl.textAlign === 'left' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '8px' }} onClick={() => upd({ textAlign: 'left' })}><AlignLeft size={15} /></button>
                    <button className={`btn ${selectedEl.textAlign === 'center' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '8px' }} onClick={() => upd({ textAlign: 'center' })}><AlignCenter size={15} /></button>
                    <button className={`btn ${selectedEl.textAlign === 'right' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '8px' }} onClick={() => upd({ textAlign: 'right' })}><AlignRight size={15} /></button>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Color</label>
                  <input type="color" value={selectedEl.color || '#ffffff'} onChange={(e) => upd({ color: e.target.value })}
                    style={{ width: '100%', height: 40, cursor: 'pointer', border: 'none', background: 'none', borderRadius: 8 }} />
                </div>

                {/* Text Background */}
                <div style={{ background: 'var(--bg-dark)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span className="input-label" style={{ marginBottom: 0 }}>Text Background</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedEl.textBg?.enabled || false}
                        onChange={(e) => upd({ textBg: { ...(selectedEl.textBg || {}), enabled: e.target.checked } })} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enable</span>
                    </label>
                  </div>
                  {selectedEl.textBg?.enabled && (
                    <>
                      <div className="input-group">
                        <label className="input-label">Style</label>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {BG_STYLES.map(s => (
                            <button key={s} onClick={() => upd({ textBg: { ...(selectedEl.textBg || {}), style: s } })}
                              className={`btn ${selectedEl.textBg?.style === s ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ fontSize: '0.75rem', padding: '5px 10px', textTransform: 'capitalize' }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="input-group">
                        <label className="input-label">BG Color</label>
                        <input type="color" value={selectedEl.textBg?.color || '#6366f1'}
                          onChange={(e) => upd({ textBg: { ...(selectedEl.textBg || {}), color: e.target.value } })}
                          style={{ width: '100%', height: 36, cursor: 'pointer', border: 'none', background: 'none', borderRadius: 8 }} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Opacity</label>
                        <input type="range" min={0.1} max={1} step={0.05}
                          value={selectedEl.textBg?.opacity ?? 0.8}
                          onChange={(e) => upd({ textBg: { ...(selectedEl.textBg || {}), opacity: parseFloat(e.target.value) } })}
                          style={{ width: '100%' }} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Corner Radius</label>
                        <input type="range" min={0} max={40} step={1}
                          value={selectedEl.textBg?.borderRadius ?? 4}
                          onChange={(e) => upd({ textBg: { ...(selectedEl.textBg || {}), borderRadius: parseInt(e.target.value) } })}
                          style={{ width: '100%' }} />
                      </div>
                    </>
                  )}
                </div>

                <div className="input-group">
                  <label className="input-label">Rotation</label>
                  <input type="range" min={-180} max={180} step={1} value={selectedEl.rotation || 0}
                    onChange={(e) => upd({ rotation: parseFloat(e.target.value) })} style={{ width: '100%' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{Math.round(selectedEl.rotation || 0)}°</span>
                </div>
              </>
            )}

            {selectedEl.type === 'image' && (
              <>
                <div className="input-group">
                  <label className="input-label">Width (%)</label>
                  <input type="range" min={2} max={80} step={0.5} value={selectedEl.w || 20}
                    onChange={(e) => upd({ w: parseFloat(e.target.value) })} style={{ width: '100%' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{(selectedEl.w || 20).toFixed(1)}%</span>
                </div>
                <div className="input-group">
                  <label className="input-label">Height (%)</label>
                  <input type="range" min={2} max={80} step={0.5} value={selectedEl.h ?? selectedEl.w ?? 20}
                    onChange={(e) => upd({ h: parseFloat(e.target.value) })} style={{ width: '100%' }} />
                </div>
                <div className="input-group">
                  <label className="input-label">Rotation</label>
                  <input type="range" min={-180} max={180} step={1} value={selectedEl.rotation || 0}
                    onChange={(e) => upd({ rotation: parseFloat(e.target.value) })} style={{ width: '100%' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{Math.round(selectedEl.rotation || 0)}°</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
