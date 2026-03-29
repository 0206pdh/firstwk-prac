import { create } from 'zustand';
import { RecordingState, AnalyzeResponse } from '../types';

interface RecordingStore {
  state: RecordingState;
  audioUri: string | null;
  songTitle: string;
  result: AnalyzeResponse | null;
  error: string | null;

  setState: (state: RecordingState) => void;
  setAudioUri: (uri: string | null) => void;
  setSongTitle: (title: string) => void;
  setResult: (result: AnalyzeResponse | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useRecordingStore = create<RecordingStore>((set) => ({
  state: 'idle',
  audioUri: null,
  songTitle: '',
  result: null,
  error: null,

  setState: (state) => set({ state }),
  setAudioUri: (uri) => set({ audioUri: uri }),
  setSongTitle: (title) => set({ songTitle: title }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),
  reset: () => set({ state: 'idle', audioUri: null, result: null, error: null }),
}));
