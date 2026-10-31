import { create } from 'zustand';

export interface ScanEvent {
  id: string;
  image_url: string;
  material_type: string;
  estimated_weight: number;
  latitude: number;
  longitude: number;
  credit_value: number;
  ai_confidence_score: number;
  timestamp: string;
}

interface ScanState {
  recentScans: ScanEvent[];
  pendingScan: Partial<ScanEvent> | null;
  setPendingScan: (scan: Partial<ScanEvent> | null) => void;
  addScan: (scan: ScanEvent) => void;
  setScans: (scans: ScanEvent[]) => void;
}

export const useScanStore = create<ScanState>((set) => ({
  recentScans: [],
  pendingScan: null,

  setPendingScan: (scan) => set({ pendingScan: scan }),

  addScan: (scan) =>
    set((state) => ({ recentScans: [scan, ...state.recentScans] })),

  setScans: (scans) => set({ recentScans: scans }),
}));
