import styles from '../app.module.css';
import { CanvasSize, PointerType, Tool } from '../types';

interface StatusBarProps {
  tool: Tool;
  toolLabels: Record<Tool, string>;
  color: string;
  brushSize: number;
  canvasSize: CanvasSize;
  pointerType: PointerType;
  pointerLabels: Record<PointerType, string>;
  isPointerDown: boolean;
  isPastingMode: boolean;
}

export function StatusBar({
  tool,
  toolLabels,
  color,
  brushSize,
  canvasSize,
  pointerType,
  pointerLabels,
  isPointerDown,
  isPastingMode,
}: StatusBarProps) {
  const { width, height } = canvasSize;
  const canvasLabel = width > 0 && height > 0 ? `${width}×${height}px` : 'Sizing…';

  return (
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
      <span className={styles.statusItem}>Canvas: {canvasLabel}</span>
      <span className={styles.statusItem}>Input: {pointerLabels[pointerType]}</span>
      <span className={styles.statusItem}>State: {isPointerDown ? 'Drawing' : 'Ready'}</span>
      {isPastingMode && <span className={styles.statusHighlight}>Paste mode active · Click to place</span>}
    </div>
  );
}
