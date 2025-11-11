import { Selection } from '../types';

export function normalizeSelection(selection: Selection): Selection {
  const width = Math.abs(selection.width);
  const height = Math.abs(selection.height);
  const x = selection.width < 0 ? selection.x + selection.width : selection.x;
  const y = selection.height < 0 ? selection.y + selection.height : selection.y;

  return { x, y, width, height };
}
