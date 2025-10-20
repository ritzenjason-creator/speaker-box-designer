// app/store.ts
import { create } from 'zustand';
import { DriverParams, BoxParams, EnclosureResult, calculateEnclosure } from '../utils/math';

type Mode = 'Sealed' | 'Ported' | 'Bandpass 4th' | 'Bandpass 6th';

type StoreState = {
  driver: DriverParams | null;
  box: BoxParams | null;
  mode: Mode;
  result: EnclosureResult | null;
  setDriver: (d: DriverParams) => void;
  setBox: (b: BoxParams) => void;
  setMode: (m: Mode) => void;
  runCalculation: () => void;
  reset: () => void;
};

export const useStore = create<StoreState>((set, get) => ({
  driver: null,
  box: null,
  mode: 'Ported',
  result: null,

  setDriver: (d) => set({ driver: d }),
  setBox: (b) => set({ box: b }),
  setMode: (m) => set({ mode: m }),

  runCalculation: () => {
    const { driver, box, mode } = get();
    if (driver && box) {
      const result = calculateEnclosure(mode, driver, box);
      set({ result });
    }
  },

  reset: () => set({ driver: null, box: null, mode: 'Ported', result: null }),
}));
