export type Tool = 'pencil' | 'brush' | 'eraser' | 'rectangle' | 'oval';

export type PointerType = 'mouse' | 'touch' | 'pen';

export interface Selection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}
