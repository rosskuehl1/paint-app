import { useRef, useEffect, useState, useCallback } from 'react';
import styles from './app.module.css';

type Tool = 'pencil' | 'brush' | 'eraser' | 'rectangle' | 'oval';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectionShape, setSelectionShape] = useState<'rectangle' | 'oval' | null>(null);
  const [copiedImageData, setCopiedImageData] = useState<ImageData | null>(null);
  const [pastePreviewPos, setPastePreviewPos] = useState<{ x: number; y: number } | null>(null);
  const [isPastingMode, setIsPastingMode] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [activePointerType, setActivePointerType] = useState<'mouse' | 'touch' | 'pen'>('mouse');
  const [isPointerDown, setIsPointerDown] = useState(false);

  const toolLabels: Record<Tool, string> = {
    pencil: 'Pencil',
    brush: 'Brush',
    eraser: 'Eraser',
    rectangle: 'Rectangle',
    oval: 'Oval'
  };

  const pointerLabels: Record<'mouse' | 'touch' | 'pen', string> = {
    mouse: 'Mouse',
    touch: 'Touch',
    pen: 'Stylus'
  };

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!ctx || !overlayCtx) return;

    const toolbarHeight = toolbarRef.current?.getBoundingClientRect().height ?? 0;
    const width = window.innerWidth;
    const height = Math.max(window.innerHeight - toolbarHeight, 200);

    const snapshotCanvas = document.createElement('canvas');
    snapshotCanvas.width = canvas.width;
    snapshotCanvas.height = canvas.height;
    const snapshotCtx = snapshotCanvas.getContext('2d');
    if (snapshotCtx) {
      snapshotCtx.drawImage(canvas, 0, 0);
    }

    canvas.width = width;
    canvas.height = height;
    overlayCanvas.width = width;
    overlayCanvas.height = height;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    if (snapshotCanvas.width > 0 && snapshotCanvas.height > 0) {
      ctx.drawImage(snapshotCanvas, 0, 0);
    }

    overlayCtx.clearRect(0, 0, width, height);
    setCanvasSize({ width, height });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);

    let observer: ResizeObserver | null = null;
    const toolbarEl = toolbarRef.current;
    if ('ResizeObserver' in window && toolbarEl) {
      observer = new ResizeObserver(() => resizeCanvas());
      observer.observe(toolbarEl);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (observer && toolbarEl) {
        observer.unobserve(toolbarEl);
      }
      observer?.disconnect();
    };
  }, [resizeCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    if (isPastingMode) {
      canvas.style.cursor = 'copy';
      overlayCanvas.style.cursor = 'copy';
      return;
    }

    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
      const visibleSize = Math.ceil(Math.min(Math.max(brushSize, 6), 64));
      const diameter = visibleSize + 6;
      const cursorCanvas = document.createElement('canvas');
      cursorCanvas.width = diameter;
      cursorCanvas.height = diameter;
      const cursorCtx = cursorCanvas.getContext('2d');

      if (cursorCtx) {
        cursorCtx.clearRect(0, 0, diameter, diameter);
        cursorCtx.beginPath();
        cursorCtx.arc(diameter / 2, diameter / 2, visibleSize / 2, 0, Math.PI * 2);
        cursorCtx.fillStyle = tool === 'eraser' ? 'rgba(255, 255, 255, 0.85)' : color;
        cursorCtx.globalAlpha = tool === 'brush' ? 0.6 : 1;
        cursorCtx.fill();
        cursorCtx.globalAlpha = 1;
        cursorCtx.lineWidth = 1;
        cursorCtx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        cursorCtx.stroke();
      }

      const hotspot = diameter / 2;
      const dataUrl = cursorCanvas.toDataURL();
      const cursorValue = `url(${dataUrl}) ${hotspot} ${hotspot}, crosshair`;
      canvas.style.cursor = cursorValue;
      overlayCanvas.style.cursor = cursorValue;
    } else {
      canvas.style.cursor = 'crosshair';
      overlayCanvas.style.cursor = 'crosshair';
    }
  }, [tool, brushSize, color, isPastingMode]);

  const getCanvasCoordinates = useCallback((canvas: HTMLCanvasElement, event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }, []);

  // Copy function - copies selected region
  const copySelection = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedRegion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Normalize the region (handle negative width/height)
    const normalizedRegion = {
      x: selectedRegion.width < 0 ? selectedRegion.x + selectedRegion.width : selectedRegion.x,
      y: selectedRegion.height < 0 ? selectedRegion.y + selectedRegion.height : selectedRegion.y,
      width: Math.abs(selectedRegion.width),
      height: Math.abs(selectedRegion.height)
    };

    // Get the image data from the selected region
    const imageData = ctx.getImageData(
      normalizedRegion.x,
      normalizedRegion.y,
      normalizedRegion.width,
      normalizedRegion.height
    );

    setCopiedImageData(imageData);
    setNotification('Copied to clipboard');
  }, [selectedRegion]);

  // Cut function - copies and clears selected region
  const cutSelection = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedRegion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Copy first
    copySelection();

    // Normalize the region
    const normalizedRegion = {
      x: selectedRegion.width < 0 ? selectedRegion.x + selectedRegion.width : selectedRegion.x,
      y: selectedRegion.height < 0 ? selectedRegion.y + selectedRegion.height : selectedRegion.y,
      width: Math.abs(selectedRegion.width),
      height: Math.abs(selectedRegion.height)
    };

    // Clear the region (fill with white)
    ctx.fillStyle = 'white';
    ctx.fillRect(normalizedRegion.x, normalizedRegion.y, normalizedRegion.width, normalizedRegion.height);

    // Clear selection
    setSelectedRegion(null);
    setSelectionShape(null);
    const overlayCanvas = overlayCanvasRef.current;
    if (overlayCanvas) {
      const overlayCtx = overlayCanvas.getContext('2d');
      if (overlayCtx) {
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      }
    }
    setNotification('Cut to clipboard');
  }, [selectedRegion, copySelection]);

  // Paste function - enters paste mode
  const startPasteMode = useCallback(() => {
    if (!copiedImageData) return;
    setIsPastingMode(true);
    setSelectedRegion(null);
    setSelectionShape(null);
    setNotification('Click to paste');
    
    // Clear overlay
    const overlayCanvas = overlayCanvasRef.current;
    if (overlayCanvas) {
      const overlayCtx = overlayCanvas.getContext('2d');
      if (overlayCtx) {
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      }
    }
  }, [copiedImageData]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;

      if (modifierKey && e.key.toLowerCase() === 'c' && selectedRegion) {
        e.preventDefault();
        copySelection();
      } else if (modifierKey && e.key.toLowerCase() === 'x' && selectedRegion) {
        e.preventDefault();
        cutSelection();
      } else if (modifierKey && e.key.toLowerCase() === 'v' && copiedImageData) {
        e.preventDefault();
        startPasteMode();
      } else if (e.key === 'Escape' && isPastingMode) {
        e.preventDefault();
        setIsPastingMode(false);
        setPastePreviewPos(null);
        const overlayCanvas = overlayCanvasRef.current;
        if (overlayCanvas) {
          const overlayCtx = overlayCanvas.getContext('2d');
          if (overlayCtx) {
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRegion, copiedImageData, isPastingMode, copySelection, cutSelection, startPasteMode]);

  // Update paste preview on mouse move
  useEffect(() => {
    if (!isPastingMode || !copiedImageData) return;

    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;

    const overlayCtx = overlayCanvas.getContext('2d');
    if (!overlayCtx || !pastePreviewPos) return;

    // Clear overlay
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Draw preview with transparency
    overlayCtx.globalAlpha = 0.7;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = copiedImageData.width;
    tempCanvas.height = copiedImageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(copiedImageData, 0, 0);
      overlayCtx.drawImage(
        tempCanvas,
        pastePreviewPos.x - copiedImageData.width / 2,
        pastePreviewPos.y - copiedImageData.height / 2
      );
    }
    overlayCtx.globalAlpha = 1;

    // Draw border around preview
    overlayCtx.strokeStyle = '#007bff';
    overlayCtx.lineWidth = 2;
    overlayCtx.setLineDash([5, 5]);
    overlayCtx.strokeRect(
      pastePreviewPos.x - copiedImageData.width / 2,
      pastePreviewPos.y - copiedImageData.height / 2,
      copiedImageData.width,
      copiedImageData.height
    );
    overlayCtx.setLineDash([]);
  }, [isPastingMode, copiedImageData, pastePreviewPos]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const point = getCanvasCoordinates(canvas, e);
    const { x, y } = point;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore capture errors when pointer events are not fully supported
    }

    const normalizedPointer = e.pointerType === 'pen' ? 'pen' : e.pointerType === 'touch' ? 'touch' : 'mouse';
    setActivePointerType(normalizedPointer);

    // Handle paste mode
    if (isPastingMode && copiedImageData) {
      // Paste the image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = copiedImageData.width;
      tempCanvas.height = copiedImageData.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(copiedImageData, 0, 0);
        ctx.drawImage(
          tempCanvas,
          x - copiedImageData.width / 2,
          y - copiedImageData.height / 2
        );
      }

      // Exit paste mode
      setIsPastingMode(false);
      setPastePreviewPos(null);
      setNotification('Pasted successfully');
      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas) {
        const overlayCtx = overlayCanvas.getContext('2d');
        if (overlayCtx) {
          overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }
      }
      return;
    }

    setIsDrawing(true);
    setIsPointerDown(true);

    if (tool === 'rectangle' || tool === 'oval') {
      setSelectionStart({ x, y });
      setSelectedRegion(null);
      setSelectionShape(null);
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const { x, y } = getCanvasCoordinates(canvas, e);

    // Update paste preview position
    if (isPastingMode) {
      setPastePreviewPos({ x, y });
      return;
    }

    if (!isDrawing) return;

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!ctx || !overlayCtx) return;

    if (tool === 'rectangle' || tool === 'oval') {
      // Draw selection on overlay canvas
      if (!selectionStart) return;
      
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      
      let width = x - selectionStart.x;
      let height = y - selectionStart.y;

      if (e.shiftKey) {
        const size = Math.max(Math.abs(width), Math.abs(height));
        const widthSign = width === 0 ? 1 : Math.sign(width);
        const heightSign = height === 0 ? 1 : Math.sign(height);
        width = size * widthSign;
        height = size * heightSign;
      }
      
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

  const stopDrawing = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!ctx || !overlayCtx) return;

    if (isDrawing && selectionStart && e && (tool === 'rectangle' || tool === 'oval')) {
      const { x, y } = getCanvasCoordinates(canvas, e);

      let width = x - selectionStart.x;
      let height = y - selectionStart.y;

      if (e.shiftKey) {
        const size = Math.max(Math.abs(width), Math.abs(height));
        const widthSign = width === 0 ? 1 : Math.sign(width);
        const heightSign = height === 0 ? 1 : Math.sign(height);
        width = size * widthSign;
        height = size * heightSign;
      }
      
      setSelectedRegion({
        x: selectionStart.x,
        y: selectionStart.y,
        width,
        height
      });
      setSelectionShape(tool);
    }

    setIsDrawing(false);
    setIsPointerDown(false);
    ctx.closePath();
    ctx.globalAlpha = 1; // Reset alpha
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    overlayCtx.setLineDash([]);
    setSelectionStart(null);

    if (e) {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore pointer capture release errors
      }
    }
  };

  useEffect(() => {
    if (isDrawing) return;
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;

    const overlayCtx = overlayCanvas.getContext('2d');
    if (!overlayCtx) return;

    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (!selectedRegion || !selectionShape) return;

    const normalizedRegion = {
      x: selectedRegion.width < 0 ? selectedRegion.x + selectedRegion.width : selectedRegion.x,
      y: selectedRegion.height < 0 ? selectedRegion.y + selectedRegion.height : selectedRegion.y,
      width: Math.abs(selectedRegion.width),
      height: Math.abs(selectedRegion.height)
    };

    overlayCtx.strokeStyle = selectionShape === 'oval' ? '#0d6efd' : '#007bff';
    overlayCtx.lineWidth = 1;
    overlayCtx.setLineDash([6, 6]);

    if (selectionShape === 'rectangle') {
      overlayCtx.strokeRect(
        normalizedRegion.x,
        normalizedRegion.y,
        normalizedRegion.width,
        normalizedRegion.height
      );
    } else if (selectionShape === 'oval') {
      overlayCtx.beginPath();
      overlayCtx.ellipse(
        normalizedRegion.x + normalizedRegion.width / 2,
        normalizedRegion.y + normalizedRegion.height / 2,
        Math.abs(normalizedRegion.width / 2),
        Math.abs(normalizedRegion.height / 2),
        0,
        0,
        2 * Math.PI
      );
      overlayCtx.stroke();
    }

    overlayCtx.setLineDash([]);
  }, [selectedRegion, selectionShape, isDrawing, canvasSize]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar} ref={toolbarRef}>
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
          <button
            className={styles.toolButton}
            onClick={copySelection}
            disabled={!selectedRegion}
            title="Copy (Ctrl/Cmd+C)"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="7" y="7" width="9" height="9" rx="1"/>
              <path d="M4 13V4h9"/>
            </svg>
            <span className={styles.toolLabel}>Copy</span>
          </button>
          <button
            className={styles.toolButton}
            onClick={cutSelection}
            disabled={!selectedRegion}
            title="Cut (Ctrl/Cmd+X)"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="6" r="2"/>
              <circle cx="6" cy="14" r="2"/>
              <line x1="14" y1="4" x2="8" y2="7"/>
              <line x1="14" y1="16" x2="8" y2="13"/>
              <line x1="14" y1="4" x2="14" y2="16"/>
            </svg>
            <span className={styles.toolLabel}>Cut</span>
          </button>
          <button
            className={`${styles.toolButton} ${isPastingMode ? styles.active : ''}`}
            onClick={startPasteMode}
            disabled={!copiedImageData}
            title="Paste (Ctrl/Cmd+V)"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="6" width="10" height="12" rx="1"/>
              <path d="M8 6V4h4v2"/>
              <line x1="9" y1="11" x2="13" y2="11"/>
              <line x1="9" y1="14" x2="13" y2="14"/>
            </svg>
            <span className={styles.toolLabel}>Paste</span>
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
              setSelectedRegion(null);
              setSelectionShape(null);
              const overlayCanvas = overlayCanvasRef.current;
              if (overlayCanvas) {
                const overlayCtx = overlayCanvas.getContext('2d');
                overlayCtx?.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
              }
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
          className={`${styles.canvas} ${isPastingMode ? styles.pasteMode : ''}`}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          onPointerCancel={stopDrawing}
        />
        <canvas 
          ref={overlayCanvasRef} 
          className={`${styles.overlayCanvas} ${isPastingMode ? styles.pasteMode : ''}`}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          onPointerCancel={stopDrawing}
        />
      </div>
      <div className={styles.statusBar}>
        <span className={styles.statusItem}>Tool: {toolLabels[tool]}</span>
        <span className={styles.statusItem}>
          Color:
          <span
            className={styles.colorSwatch}
            style={{ backgroundColor: tool === 'eraser' ? '#ffffff' : color }}
            aria-hidden="true"
          />
          {tool === 'eraser' ? 'Eraser white' : color.toUpperCase()}
        </span>
        <span className={styles.statusItem}>Size: {brushSize}px</span>
        <span className={styles.statusItem}>
          Canvas: {canvasSize.width > 0 && canvasSize.height > 0 ? `${canvasSize.width}×${canvasSize.height}px` : 'Sizing…'}
        </span>
        <span className={styles.statusItem}>Input: {pointerLabels[activePointerType]}</span>
        <span className={styles.statusItem}>State: {isPointerDown ? 'Drawing' : 'Ready'}</span>
        {isPastingMode && (
          <span className={styles.statusHighlight}>Paste mode active · Click to place</span>
        )}
      </div>
      {notification && (
        <div className={styles.notification}>
          {notification}
        </div>
      )}
    </div>
  );
}

export default App;
