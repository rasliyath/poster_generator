// posterExport.js
// Renders the poster on an HTML Canvas — mirrors CSS layout exactly.
//
// KEY INSIGHT:
// CSS does:  position:absolute; left:pxX; top:pxY; width:pxW; height:auto
//            transform: rotate(Xdeg); transform-origin: center center
//
// "center center" means the pivot is the center of the RENDERED box, i.e.:
//   pivotX = pxX + pxW / 2
//   pivotY = pxY + renderedHeight / 2
//
// renderedHeight for a text element = textH + 2*paddingY  (from textBg)
// We must compute this same value and use it as the pivot to match perfectly.

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/** Wrap text to fit maxWidth using canvas measurement (exact, not estimated). */
function wrapText(ctx, text, maxWidth) {
    const result = [];
    for (const hard of text.split('\n')) {
        if (!hard.trim()) { result.push(''); continue; }
        let line = '';
        for (const word of hard.split(' ')) {
            const test = line ? `${line} ${word}` : word;
            if (ctx.measureText(test).width <= maxWidth) {
                line = test;
            } else {
                if (line) result.push(line);
                line = word;
            }
        }
        if (line) result.push(line);
    }
    return result;
}

function hexToRgba(hex, opacity = 1) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${opacity})`;
}

function drawRoundRect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, r);
    } else {
        const minR = Math.min(Math.abs(r), Math.abs(w) / 2, Math.abs(h) / 2);
        ctx.moveTo(x + minR, y);
        ctx.lineTo(x + w - minR, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + minR);
        ctx.lineTo(x + w, y + h - minR);
        ctx.quadraticCurveTo(x + w, y + h, x + w - minR, y + h);
        ctx.lineTo(x + minR, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - minR);
        ctx.lineTo(x, y + minR);
        ctx.quadraticCurveTo(x, y, x + minR, y);
        ctx.closePath();
    }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * @param {string} thumbnailUrl  background data-URL
 * @param {Array}  elements      same array used by Canvas.jsx / ElementRenderer.jsx
 * @param {string} aspectRatio   '16:9' | '9:16' | '1:1'
 * @returns {Promise<string>}    JPEG data-URL of the final poster
 */
export async function generatePosterOnCanvas(thumbnailUrl, elements, aspectRatio, overlay) {
    const SIZES = { '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080] };
    const [TW, TH] = SIZES[aspectRatio] || [1920, 1080];

    const canvas = document.createElement('canvas');
    canvas.width = TW;
    canvas.height = TH;
    const ctx = canvas.getContext('2d');

    // ── 1. Background (mirrors CSS object-fit: cover) ─────────────────────────
    const bg = await loadImage(thumbnailUrl);
    const bgRatio = bg.width / bg.height;
    const canRatio = TW / TH;
    let sx, sy, sw, sh;
    if (bgRatio > canRatio) {
        sh = bg.height; sw = sh * canRatio;
        sx = (bg.width - sw) / 2; sy = 0;
    } else {
        sw = bg.width; sh = sw / canRatio;
        sx = 0; sy = (bg.height - sh) / 2;
    }
    ctx.drawImage(bg, sx, sy, sw, sh, 0, 0, TW, TH);
    
    // ── 1.5. Global Overlay ────────────────────────────────────────────────────
    if (overlay?.enabled) {
        ctx.save();
        const grad = ctx.createLinearGradient(0, 0, 0, TH);
        grad.addColorStop(0.3, 'transparent');
        grad.addColorStop(1, hexToRgba(overlay.color, overlay.opacity));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, TW, TH);
        ctx.restore();
    }

    // ── 2. Elements ────────────────────────────────────────────────────────────
    for (const el of elements) {
        if (!el) continue;

        // Convert % coordinates to pixels (same as ElementRenderer)
        const pxX = (el.x / 100) * TW;
        const pxY = (el.y / 100) * TH;
        const pxW = (el.w / 100) * TW;
        const pxH = el.type === 'image' ? (((el.h ?? el.w) / 100) * TH) : 0;
        const rad = ((el.rotation || 0) * Math.PI) / 180;

        // ── Image element ─────────────────────────────────────────────────────
        if (el.type === 'image' && el.src) {
            try {
                const img = await loadImage(el.src);
                ctx.save();
                // pivot = centre of the fixed-size image box
                ctx.translate(pxX + pxW / 2, pxY + pxH / 2);
                ctx.rotate(rad);
                ctx.drawImage(img, -pxW / 2, -pxH / 2, pxW, pxH);
                ctx.restore();
            } catch (e) {
                console.warn('Image element skipped:', e.message);
            }
            continue;
        }

        // ── Text element ──────────────────────────────────────────────────────
        if (el.type !== 'text' && !el.text) continue;

        const fsz = ((el.fontSize || 5) / 100) * TW;
        const lineH = fsz * 1.25;
        const family = el.fontFamily || 'Outfit';
        const color = el.color || '#ffffff';
        const align = el.textAlign || 'left';
        const tb = el.textBg || {};

        const fWeight = el.bold ? 'bold' : 'normal';
        const fStyle = el.italic ? 'italic' : 'normal';

        // Set font BEFORE wrapText so measureText is accurate
        ctx.font = `${fStyle} ${fWeight} ${fsz}px "${family}", Arial, sans-serif`;

        const lines = wrapText(ctx, el.text || '', pxW);
        const textH = lines.length * lineH;

        // Vertical padding — matches CSS `padding: ${pad}px ${pad*1.5}px` from getTextBgStyle
        // Only applied when textBg is enabled (mirrors CSS exactly)
        const padV = tb.enabled ? (tb.padding ?? 8) : 0;
        const padH = tb.enabled ? ((tb.padding ?? 8) * 1.5) : 0;

        // renderedHeight = what the browser's auto-height div actually measures
        // = textH + top-padding + bottom-padding
        const renderedH = textH + padV * 2;
        const renderedW = pxW;   // width is always explicit (set in px)

        // ─── CSS transform-origin: center center ──────────────────────────────
        // pivot is at the center of the rendered box
        const pivotX = pxX + renderedW / 2;
        const pivotY = pxY + renderedH / 2;

        ctx.save();
        ctx.translate(pivotX, pivotY);
        ctx.rotate(rad);

        // After translate, box top-left is at:
        const boxL = -renderedW / 2;
        const boxT = -renderedH / 2;

        // ─── Background rectangle ─────────────────────────────────────────────
        if (tb.enabled) {
            const rx = tb.borderRadius ?? 4;
            const op = tb.opacity ?? 0.8;
            const bgC = tb.color || '#6366f1';
            const sty = tb.style || 'solid';

            ctx.beginPath();
            drawRoundRect(ctx, boxL, boxT, renderedW, renderedH, rx);

            if (sty === 'gradient') {
                const g = ctx.createLinearGradient(boxL, boxT, boxL + renderedW, boxT + renderedH);
                g.addColorStop(0, hexToRgba(bgC, op));
                g.addColorStop(1, hexToRgba(bgC, Math.max(0, op - 0.4)));
                ctx.fillStyle = g;
                ctx.fill();
            } else if (sty === 'neon') {
                ctx.strokeStyle = bgC;
                ctx.lineWidth = 2;
                ctx.shadowColor = bgC;
                ctx.shadowBlur = 10;
                ctx.stroke();
                ctx.shadowBlur = 0;
            } else if (sty === 'strip') {
                ctx.fillStyle = hexToRgba(bgC, op);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(boxL, boxT);
                ctx.lineTo(boxL + renderedW, boxT);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(boxL, boxT + renderedH);
                ctx.lineTo(boxL + renderedW, boxT + renderedH);
                ctx.stroke();
            } else {
                // solid / glassmorphism
                ctx.fillStyle = hexToRgba(bgC, op);
                ctx.fill();
            }
        }

        // ─── Text lines ───────────────────────────────────────────────────────
        // text starts at boxT + padV (top padding)
        const textStartY = boxT + padV;

        // Horizontal position for text-anchor (mirrors CSS text-align + padding)
        let textX;
        if (align === 'center') textX = 0;               // centre of box
        else if (align === 'right') textX = renderedW / 2 - padH;  // right edge - padding
        else textX = boxL + padH;     // left edge + padding

        ctx.textAlign = align;
        ctx.textBaseline = 'top';
        ctx.fillStyle = color;

        if (!tb.enabled) {
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 2;
            ctx.shadowBlur = 6;
        } else {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }

        lines.forEach((line, i) => {
            ctx.fillText(line, textX, textStartY + i * lineH);
        });

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    return canvas.toDataURL('image/jpeg', 0.92);
}