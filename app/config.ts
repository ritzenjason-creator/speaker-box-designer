// config.ts - App-level constants, defaults, themes, etc.
export const DEFAULT_BOX = {
  Vb: 50,
  Fb: 32,
  slotPort: true,
  portWidth: 3,
  portHeight: 12,
  wallThickness: 0.75,
};

export const MODES = ['Sealed', 'Ported', 'Bandpass 4th', 'Bandpass 6th'] as const;
export type Mode = (typeof MODES)[number];
