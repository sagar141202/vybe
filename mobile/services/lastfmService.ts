import AsyncStorage from '@react-native-async-storage/async-storage';
import { createHash } from 'react-native-quick-crypto';

const LASTFM_API = 'https://ws.audioscrobbler.com/2.0/';

export interface LastfmConfig {
  apiKey: string;
  apiSecret: string;
  sessionKey: string;
  username: string;
}

export async function getLastfmConfig(): Promise<LastfmConfig | null> {
  try {
    const data = await AsyncStorage.getItem('lastfm_config');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

export async function saveLastfmConfig(config: LastfmConfig): Promise<void> {
  await AsyncStorage.setItem('lastfm_config', JSON.stringify(config));
}

export async function clearLastfmConfig(): Promise<void> {
  await AsyncStorage.removeItem('lastfm_config');
}

function md5(str: string): string {
  // Simple MD5 for Last.fm signing — use crypto-js
  const CryptoJS = require('crypto-js');
  return CryptoJS.MD5(str).toString();
}

function sign(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params).sort()
    .map(k => `${k}${params[k]}`)
    .join('');
  return md5(sorted + secret);
}

async function lastfmPost(params: Record<string, string>, secret: string): Promise<any> {
  const sig = sign(params, secret);
  const body = new URLSearchParams({ ...params, api_sig: sig, format: 'json' });

  const res = await fetch(LASTFM_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  return res.json();
}

export async function getLastfmSession(
  apiKey: string,
  apiSecret: string,
  token: string,
): Promise<{ key: string; name: string } | null> {
  try {
    const params = { method: 'auth.getSession', api_key: apiKey, token };
    const data = await lastfmPost(params, apiSecret);
    if (data?.session) {
      return { key: data.session.key, name: data.session.name };
    }
    return null;
  } catch (e) {
    console.error('Last.fm auth error:', e);
    return null;
  }
}

export async function scrobbleTrack(
  config: LastfmConfig,
  track: {
    title: string;
    artist: string;
    album?: string | null;
    duration_ms?: number | null;
  },
): Promise<boolean> {
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params: Record<string, string> = {
      method: 'track.scrobble',
      api_key: config.apiKey,
      sk: config.sessionKey,
      'artist[0]': track.artist,
      'track[0]': track.title,
      'timestamp[0]': timestamp,
    };
    if (track.album) params['album[0]'] = track.album;
    if (track.duration_ms) params['duration[0]'] = Math.floor(track.duration_ms / 1000).toString();

    const data = await lastfmPost(params, config.apiSecret);
    const accepted = data?.scrobbles?.['@attr']?.accepted;
    console.log(`Last.fm scrobble: ${track.title} — accepted=${accepted}`);
    return accepted > 0;
  } catch (e) {
    console.error('Scrobble error:', e);
    return false;
  }
}

export async function updateNowPlaying(
  config: LastfmConfig,
  track: { title: string; artist: string; album?: string | null; duration_ms?: number | null },
): Promise<void> {
  try {
    const params: Record<string, string> = {
      method: 'track.updateNowPlaying',
      api_key: config.apiKey,
      sk: config.sessionKey,
      artist: track.artist,
      track: track.title,
    };
    if (track.album) params.album = track.album;
    if (track.duration_ms) params.duration = Math.floor(track.duration_ms / 1000).toString();

    await lastfmPost(params, config.apiSecret);
    console.log(`Last.fm now playing: ${track.title}`);
  } catch (e) {
    console.error('Now playing error:', e);
  }
}
