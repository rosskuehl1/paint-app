import { useRef, useEffect, useState } from 'react';
import styles from './app.module.css';

type Tool = 'pencil' | 'brush' | 'eraser' | 'rectangle' | 'oval';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // Suppress unused warning - selectedRegion is set for future use
  console.log(selectedRegion);

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = window.innerWidth;
    const height = window.innerHeight - 60; // Account for toolbar height
    
    canvas.width = width;
    canvas.height = height;
    overlayCanvas.width = width;
    overlayCanvas.height = height;

    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'rectangle' || tool === 'oval') {
      setSelectionStart({ x, y });
      setSelectedRegion(null);
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!ctx || !overlayCtx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'rectangle' || tool === 'oval') {
      // Draw selection on overlay canvas
      if (!selectionStart) return;
      
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      
      const width = x - selectionStart.x;
      const height = y - selectionStart.y;
      
      overlayCtx.strokeStyle = '#000';
      overlayCtx.lineWidth = 1;
      overlayCtx.setLineDash([5, 5]);
      
      if (tool === 'rectangle') {
        overlayCtx.strokeRect(selectionStart.x, selectionStart.y, width, height);
      } else if (tool === 'oval') {
        overlayCtx.beginPath();
        const centerX = selectionStart.x + width / 2;
        const centerY = selectionStart.y + height / 2;
        const radiusX = Math.abs(width / 2);
        const radiusY = Math.abs(height / 2);
        overlayCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        overlayCtx.stroke();
      }
      
      return;
    }

    // Configure drawing style based on tool
    if (tool === 'eraser') {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
    } else if (tool === 'pencil') {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    } else if (tool === 'brush') {
      // Photoshop-like brush blending
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.15; // Lower alpha for smoother blending
      ctx.shadowBlur = brushSize * 0.3;
      ctx.shadowColor = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    
    // For brush, start a new path to avoid accumulation
    if (tool === 'brush') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!ctx || !overlayCtx) return;

    if (isDrawing && selectionStart && e && (tool === 'rectangle' || tool === 'oval')) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const width = x - selectionStart.x;
      const height = y - selectionStart.y;
      
      setSelectedRegion({
        x: selectionStart.x,
        y: selectionStart.y,
        width,
        height
      });
    }

    setIsDrawing(false);
    ctx.closePath();
    ctx.globalAlpha = 1; // Reset alpha
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    overlayCtx.setLineDash([]);
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <button
            className={`${styles.toolButton} ${tool === 'rectangle' ? styles.active : ''}`}
            onClick={() => setTool('rectangle')}
            title="Rectangular Selection"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="14" height="14" strokeDasharray="2,2"/>
            </svg>
            <span className={styles.toolLabel}>Rectangle</span>
          </button>
          <button
            className={`${styles.toolButton} ${tool === 'oval' ? styles.active : ''}`}
            onClick={() => setTool('oval')}
            title="Oval Selection"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="10" cy="10" rx="7" ry="7" strokeDasharray="2,2"/>
            </svg>
            <span className={styles.toolLabel}>Oval</span>
          </button>
          <button
            className={`${styles.toolButton} ${tool === 'pencil' ? styles.active : ''}`}
            onClick={() => setTool('pencil')}
            title="Pencil"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3l2 2-10 10H5v-2L15 3z"/>
            </svg>
            <span className={styles.toolLabel}>Pencil</span>
          </button>
          <button
            className={`${styles.toolButton} ${tool === 'brush' ? styles.active : ''}`}
            onClick={() => setTool('brush')}
            title="Brush"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 17c2-3 6-4 8-2 2 2 1 4-1 4-3 0-5-1-7-2z"/>
              <path d="M11 15c2-5 6-9 6-9l2 2s-4 4-9 6"/>
            </svg>
            <span className={styles.toolLabel}>Brush</span>
          </button>
          <button
            className={`${styles.toolButton} ${tool === 'eraser' ? styles.active : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 14L4 8l6-6 6 6-6 6z"/>
              <line x1="8" y1="16" x2="18" y2="16"/>
            </svg>
            <span className={styles.toolLabel}>Eraser</span>
          </button>
        </div>
        
        <div className={styles.toolGroup}>
          <label className={styles.label}>
            Color:
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={styles.colorPicker}
              disabled={tool === 'eraser'}
            />
          </label>
        </div>

        <div className={styles.toolGroup}>
          <label className={styles.label}>
            Size: {brushSize}px
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className={styles.slider}
            />
          </label>
        </div>

        <div className={styles.toolGroup}>
          <button
            className={styles.toolButton}
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }}
            title="Clear Canvas"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h14M8 6V4h4v2M5 6v10c0 1 1 2 2 2h6c1 0 2-1 2-2V6"/>
            </svg>
            <span className={styles.toolLabel}>Clear</span>
          </button>
        </div>
      </div>
      <div className={styles.canvasContainer}>
        <canvas 
          ref={canvasRef} 
          className={styles.canvas}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <canvas 
          ref={overlayCanvasRef} 
          className={styles.overlayCanvas}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
    </div>
  );
}

export default App;
