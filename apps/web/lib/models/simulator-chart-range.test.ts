import { describe, expect, it } from 'vitest';
import { filterSeriesByTimePreset } from './simulator-chart-range';

describe('filterSeriesByTimePreset', () => {
  const days = [0, 50, 100, 200, 300];
  const b = [1000, 900, 800, 700, 600];
  const s = [1000, 890, 780, 680, 580];

  it('full mantiene todos los puntos', () => {
    const r = filterSeriesByTimePreset(days, b, s, 'full');
    expect(r.days.length).toBe(5);
  });

  it('last30 recorta al final', () => {
    const r = filterSeriesByTimePreset(days, b, s, 'last30');
    expect(r.days.every((d) => d >= 300 - 30)).toBe(true);
  });

  it('devuelve vacio si la serie de dias esta vacia', () => {
    const r = filterSeriesByTimePreset([], [], [], 'full');
    expect(r.days.length).toBe(0);
  });
});
