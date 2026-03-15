import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Search tracks
export const searchTracks = async (query: string) => {
  const { data } = await api.get('/search', { params: { q: query, limit: 20 } });
  return data;
};

// Get stream URL
export const getStreamUrl = async (videoId: string) => {
  const { data } = await api.get(`/stream/${videoId}`);
  return data;
};

// Get metadata
export const getMetadata = async (videoId: string) => {
  const { data } = await api.get(`/metadata/${videoId}`);
  return data;
};
