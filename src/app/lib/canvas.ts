export function getContext(canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null {
  return canvas ? canvas.getContext('2d') : null;
}

export function withContext(
  canvas: HTMLCanvasElement | null,
  callback: (ctx: CanvasRenderingContext2D) => void
): void {
  const ctx = getContext(canvas);
  if (!ctx) {
    return;
  }

  callback(ctx);
}

export function clearCanvas(canvas: HTMLCanvasElement | null): void {
  if (!canvas) {
    return;
  }

  const { width, height } = canvas;
  withContext(canvas, (ctx) => {
    ctx.clearRect(0, 0, width, height);
  });
}
