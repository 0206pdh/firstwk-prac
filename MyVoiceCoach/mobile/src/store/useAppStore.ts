import { create } from 'zustand';
import { Song, AnalyzeResponse } from '../types';

interface AppStore {
  selectedSong: Song | null;
  recordingUri: string | null;
  result: AnalyzeResponse | null;

  setSelectedSong: (song: Song | null) => void;
  setRecordingUri: (uri: string | null) => void;
  setResult: (result: AnalyzeResponse | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  selectedSong: null,
  recordingUri: null,
  result: null,

  setSelectedSong: (song) => set({ selectedSong: song }),
  setRecordingUri: (uri) => set({ recordingUri: uri }),
  setResult: (result) => set({ result }),
  reset: () => set({ selectedSong: null, recordingUri: null, result: null }),
}));
