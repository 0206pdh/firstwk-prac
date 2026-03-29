import axios from 'axios';
import { AnalyzeResponse, Song, CoachingSegment } from '../types';

// 개발: Android 에뮬레이터 → 10.0.2.2 / 실기기 → 컴퓨터 LAN IP
export const BASE_URL = 'http://192.168.0.104:8000';

const api = axios.create({ baseURL: BASE_URL, timeout: 90000 });

export async function fetchSongs(): Promise<Song[]> {
  const res = await api.get<Song[]>('/api/songs');
  return res.data;
}

export async function searchSongs(query: string): Promise<Song[]> {
  const res = await api.get<Song[]>('/api/songs/search', { params: { q: query } });
  return res.data;
}

export async function analyzeRecording(
  audioUri: string,
  songId: string = '',
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as any);
  if (songId) formData.append('song_id', songId);

  const res = await api.post<AnalyzeResponse>('/api/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export interface CoachingAudioResponse {
  audio_base64: string;
  duration_seconds: number;
}

export async function generateCoachingAudio(
  segments: CoachingSegment[],
): Promise<CoachingAudioResponse> {
  const res = await api.post<CoachingAudioResponse>('/api/coaching/generate', { segments });
  return res.data;
}
