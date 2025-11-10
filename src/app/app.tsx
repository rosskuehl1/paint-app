import { useRef, useEffect, useState } from 'react';
import styles from './app.module.css';

type Tool = 'pen' | 'eraser';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

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

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <button
            className={`${styles.toolButton} ${tool === 'pen' ? styles.active : ''}`}
            onClick={() => setTool('pen')}
            title="Pen"
          >
            <span role="img" aria-label="Pen">✏️</span>
          </button>
          <button
            className={`${styles.toolButton} ${tool === 'eraser' ? styles.active : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            <span role="img" aria-label="Eraser">🧹</span>
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
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}

export default App;
