// utils/math.ts

export type DriverParams = {
  name: string;
  Fs: number;   // Resonant frequency (Hz)
  Qts: number;  // Total Q
  Vas: number;  // Equivalent compliance volume (liters)
  Sd: number;   // Cone area (cm²)
  Xmax: number; // Max excursion (mm)
  Re: number;   // DC resistance (ohms)
  Le: number;   // Voice coil inductance (mH)
};

export type BoxParams = {
  Vb: number;              // Internal volume (liters)
  Fb?: number;             // Tuning frequency (Hz)
  slotPort?: boolean;
  portWidth?: number;      // inches
  portHeight?: number;     // inches
  wallThickness?: number;  // inches
  width?: number;          // internal width (inches)
  height?: number;         // internal height (inches)
  depth?: number;          // internal depth (inches)
};

export type Point = { x: number; y: number };

export type EnclosureResult = {
  splCurve: Point[];
  velocityCurve: Point[];
  excursionCurve?: Point[]; // placeholder for future excursion modeling
  Vb: number;
  Fb?: number;
  Lv?: number;
  warnings: string[];
};

export type Mode = 'Sealed' | 'Ported' | 'Bandpass 4th' | 'Bandpass 6th';

const linspace = (start: number, stop: number, n = 200): number[] => {
  const step = (stop - start) / (n - 1);
  return Array.from({ length: n }, (_, i) => start + i * step);
};

export function calculateEnclosure(
  mode: Mode,
  driver: DriverParams,
  box: BoxParams
): EnclosureResult {
  const f = linspace(10, 200);

  // Default Fb if not provided
  const Fb =
    box.Fb ??
    Math.max(25, Math.min(45, Math.round((driver.Fs * 1.1 + 28) / 1)));
  const Vb = box.Vb;

  // SPL curve (placeholder model)
  const peakHz = mode === 'Sealed' ? driver.Fs * 1.2 : Fb;
  const q = mode === 'Sealed' ? Math.max(0.6, driver.Qts + 0.2) : 0.9;

  const splCurve: Point[] = f.map((x) => {
    const g = 1 / Math.sqrt(1 + Math.pow((x - peakHz) / (peakHz / q), 2));
    const y = 80 + 20 * g;
    return { x, y };
  });

  // Port velocity curve (simplified Gaussian around Fb)
  const areaIn2 = (box.portWidth ?? 3) * (box.portHeight ?? 12);
  const areaM2 = Math.max(1e-4, areaIn2 * 0.00064516);
  const velPeak = mode === 'Sealed' ? 0 : Math.min(55, 25 + (Vb / 50) * 10);

  const velocityCurve: Point[] = f.map((x) => {
    const shape = Math.exp(-Math.pow((x - Fb) / 12, 2));
    const y = mode === 'Sealed' ? 0 : velPeak * shape * (0.01 / areaM2);
    return { x, y };
  });

  // Port length (Lv) approximation
  const Lv =
    mode === 'Ported'
      ? Math.max(
          1,
          Math.round((23562.5 * areaM2 / (Fb * (Vb / 1000))) * 0.03937)
        )
      : undefined;

  // Placeholder excursion curve (to be refined later)
  const excursionCurve: Point[] = f.map((x) => {
    if (mode === 'Sealed') {
      const reactance = Math.pow(driver.Fs / x, 2);
      const displacement = (driver.Sd * driver.Xmax) / (1 + reactance);
      return { x, y: displacement };
    } else {
      const shape = 1 / (1 + Math.pow((x - Fb) / (Fb / 2), 2));
      return { x, y: driver.Xmax * shape };
    }
  });

  // Warnings
  const warnings: string[] = [];
  const vMax = velocityCurve.reduce((m, p) => Math.max(m, p.y), 0);
  if (vMax > 35)
    warnings.push(
      'Port velocity exceeds 35 m/s near tuning. Consider larger port area or lower power.'
    );
  if ((box.wallThickness ?? 0.75) < 0.75)
    warnings.push('Wall thickness under 0.75 in may reduce rigidity.');
  const xMaxExceeded = excursionCurve.some((p) => p.y > driver.Xmax);
  if (xMaxExceeded)
    warnings.push('Excursion exceeds Xmax at some frequencies.');

  return {
    splCurve,
    velocityCurve,
    excursionCurve,
    Vb,
    Fb: mode === 'Sealed' ? undefined : Fb,
    Lv,
    warnings,
  };
}
