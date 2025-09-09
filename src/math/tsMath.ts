export type DriverParams = {
  name: string;
  Fs: number;
  Qts: number;
  Vas: number;
  Sd: number;
  Xmax: number;
  Re: number;
  Le: number;
};

export type BoxParams = {
  Vb: number;
  Fb?: number;
  slotPort?: boolean;
  portWidth?: number;
  portHeight?: number;
  wallThickness?: number;
};

export type Point = { x: number; y: number };

export type EnclosureResult = {
  splCurve: Point[];
  velocityCurve: Point[];
  Vb: number;
  Fb?: number;
  Lv?: number;
  warnings: string[];
};

type Mode = 'Sealed' | 'Ported' | 'Bandpass 4th' | 'Bandpass 6th';

const linspace = (start: number, stop: number, n = 200): number[] => {
  const step = (stop - start) / (n - 1);
  return Array.from({ length: n }, (_, i) => start + i * step);
};

export function calculateEnclosure(mode: Mode, driver: DriverParams, box: BoxParams): EnclosureResult {
  const f = linspace(10, 200);
  const Fb = box.Fb ?? Math.max(25, Math.min(45, Math.round((driver.Fs * 1.1 + 28) / 1)));
  const Vb = box.Vb;

  const peakHz = mode === 'Sealed' ? driver.Fs * 1.2 : Fb;
  const q = mode === 'Sealed' ? Math.max(0.6, driver.Qts + 0.2) : 0.9;
  const splCurve: Point[] = f.map((x) => {
    const g = 1 / Math.sqrt(1 + Math.pow((x - peakHz) / (peakHz / q), 2));
    const y = 80 + 20 * g;
    return { x, y };
  });

  const areaIn2 = (box.portWidth ?? 3) * (box.portHeight ?? 12);
  const areaM2 = Math.max(1e-4, areaIn2 * 0.00064516);
  const velPeak = mode === 'Sealed' ? 0 : Math.min(55, 25 + (Vb / 50) * 10);
  const velocityCurve: Point[] = f.map((x) => {
    const shape = Math.exp(-Math.pow((x - Fb) / 12, 2));
    const y = mode === 'Sealed' ? 0 : velPeak * shape * (0.01 / areaM2);
    return { x, y };
  });

  const Lv = mode === 'Ported'
    ? Math.max(1, Math.round((23562.5 * (areaM2) / (Fb * (Vb / 1000))) * 0.03937))
    : undefined;

  const warnings: string[] = [];
  const vMax = velocityCurve.reduce((m, p) => Math.max(m, p.y), 0);
  if (vMax > 35) warnings.push('Port velocity exceeds 35 m/s near tuning. Consider larger port area or lower power.');
  if ((box.wallThickness ?? 0.75) < 0.75) warnings.push('Wall thickness under 0.75 in may reduce rigidity.');

  return { splCurve, velocityCurve, Vb, Fb: mode === 'Sealed' ? undefined : Fb, Lv, warnings };
}
