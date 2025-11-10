import { useRef, useEffect, useState } from 'react';
import styles from './app.module.css';

type Tool = 'pencil' | 'brush' | 'eraser';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 60; // Account for toolbar height

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

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Configure drawing style based on tool
    if (tool === 'eraser') {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (tool === 'pencil') {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 1;
    } else if (tool === 'brush') {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.6; // Brush has transparency for softer strokes
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(false);
    ctx.closePath();
    ctx.globalAlpha = 1; // Reset alpha
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <button
            className={`${styles.toolButton} ${tool === 'pencil' ? styles.active : ''}`}
            onClick={() => setTool('pencil')}
            title="Pencil"
          >
            <span role="img" aria-label="Pencil">✏️</span> Pencil
          </button>
          <button
            className={`${styles.toolButton} ${tool === 'brush' ? styles.active : ''}`}
            onClick={() => setTool('brush')}
            title="Brush"
          >
            <span role="img" aria-label="Brush">🖌️</span> Brush
          </button>
          <button
            className={`${styles.toolButton} ${tool === 'eraser' ? styles.active : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            <span role="img" aria-label="Eraser">🧹</span> Eraser
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
            <span role="img" aria-label="Clear">🗑️</span> Clear
          </button>
        </div>
      </div>
      <canvas 
        ref={canvasRef} 
        className={styles.canvas}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}

export default App;
