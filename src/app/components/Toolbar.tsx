import { forwardRef } from 'react';
import styles from '../app.module.css';
import { Tool } from '../types';

interface ToolbarProps {
  tool: Tool;
  selectTool: (tool: Tool) => void;
  canModifySelection: boolean;
  hasClipboard: boolean;
  isPastingMode: boolean;
  color: string;
  onColorChange: (value: string) => void;
  brushSize: number;
  onBrushSizeChange: (value: number) => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onSnapshot: () => void;
  onClearCanvas: () => void;
}

export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  {
    tool,
    selectTool,
    canModifySelection,
    hasClipboard,
    isPastingMode,
    color,
    onColorChange,
    brushSize,
    onBrushSizeChange,
    onCopy,
    onCut,
    onPaste,
    onSnapshot,
    onClearCanvas,
  },
  ref
) {
  return (
    <div className={styles.toolbar} ref={ref}>
      <div className={styles.toolGroup}>
        <button
          className={`${styles.toolButton} ${tool === 'rectangle' ? styles.active : ''}`}
          onClick={() => selectTool('rectangle')}
          title="Rectangular Selection"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="14" height="14" strokeDasharray="2,2" />
          </svg>
          <span className={styles.toolLabel}>Rectangle</span>
        </button>
        <button
          className={`${styles.toolButton} ${tool === 'oval' ? styles.active : ''}`}
          onClick={() => selectTool('oval')}
          title="Oval Selection"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="10" cy="10" rx="7" ry="7" strokeDasharray="2,2" />
          </svg>
          <span className={styles.toolLabel}>Oval</span>
        </button>
        <button
          className={`${styles.toolButton} ${tool === 'pencil' ? styles.active : ''}`}
          onClick={() => selectTool('pencil')}
          title="Pencil"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3l2 2-10 10H5v-2L15 3z" />
          </svg>
          <span className={styles.toolLabel}>Pencil</span>
        </button>
        <button
          className={`${styles.toolButton} ${tool === 'brush' ? styles.active : ''}`}
          onClick={() => selectTool('brush')}
          title="Brush"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 17c2-3 6-4 8-2 2 2 1 4-1 4-3 0-5-1-7-2z" />
            <path d="M11 15c2-5 6-9 6-9l2 2s-4 4-9 6" />
          </svg>
          <span className={styles.toolLabel}>Brush</span>
        </button>
        <button
          className={`${styles.toolButton} ${tool === 'eraser' ? styles.active : ''}`}
          onClick={() => selectTool('eraser')}
          title="Eraser"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 14L4 8l6-6 6 6-6 6z" />
            <line x1="8" y1="16" x2="18" y2="16" />
          </svg>
          <span className={styles.toolLabel}>Eraser</span>
        </button>
      </div>

      <div className={styles.toolGroup}>
        <button
          className={styles.toolButton}
          onClick={onCopy}
          disabled={!canModifySelection}
          title="Copy (Ctrl/Cmd+C)"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="7" y="7" width="9" height="9" rx="1" />
            <path d="M4 13V4h9" />
          </svg>
          <span className={styles.toolLabel}>Copy</span>
        </button>
        <button
          className={styles.toolButton}
          onClick={onCut}
          disabled={!canModifySelection}
          title="Cut (Ctrl/Cmd+X)"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="6" cy="6" r="2" />
            <circle cx="6" cy="14" r="2" />
            <line x1="14" y1="4" x2="8" y2="7" />
            <line x1="14" y1="16" x2="8" y2="13" />
            <line x1="14" y1="4" x2="14" y2="16" />
          </svg>
          <span className={styles.toolLabel}>Cut</span>
        </button>
        <button
          className={`${styles.toolButton} ${isPastingMode ? styles.active : ''}`}
          onClick={onPaste}
          disabled={!hasClipboard}
          title="Paste (Ctrl/Cmd+V)"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="6" y="6" width="10" height="12" rx="1" />
            <path d="M8 6V4h4v2" />
            <line x1="9" y1="11" x2="13" y2="11" />
            <line x1="9" y1="14" x2="13" y2="14" />
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
            onChange={(event) => onColorChange(event.target.value)}
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
            onChange={(event) => onBrushSizeChange(Number(event.target.value))}
            className={styles.slider}
          />
        </label>
      </div>

      <div className={styles.toolGroup}>
        <button className={styles.toolButton} onClick={onSnapshot} title="Snapshot" type="button">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="6" width="14" height="10" rx="2" />
            <path d="M7 6l1-2h4l1 2" />
            <circle cx="10" cy="11" r="3" />
            <path d="M16 5l1.5-1.5" />
            <path d="M3.5 4l1 1" />
          </svg>
          <span className={styles.toolLabel}>Snapshot</span>
        </button>
        <button className={styles.toolButton} onClick={onClearCanvas} title="Clear Canvas" type="button">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h14M8 6V4h4v2M5 6v10c0 1 1 2 2 2h6c1 0 2-1 2-2V6" />
          </svg>
          <span className={styles.toolLabel}>Clear</span>
        </button>
      </div>
    </div>
  );
});
