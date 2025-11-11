import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import App from './app';

beforeAll(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: vi.fn(() => null),
  });

  Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
    value: vi.fn(() => 'data:image/png;base64,'),
  });
});

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('should render the clear button', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /Clear/i })).toBeTruthy();
  });
});
