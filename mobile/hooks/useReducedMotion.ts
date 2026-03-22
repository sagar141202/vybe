import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

let _reducedMotion = false;
const _listeners = new Set<(v: boolean) => void>();

// Check on startup
AccessibilityInfo.isReduceMotionEnabled().then(v => {
  _reducedMotion = v;
  _listeners.forEach(cb => cb(v));
});

// Listen for changes
AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
  _reducedMotion = v;
  _listeners.forEach(cb => cb(v));
});

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(_reducedMotion);
  useEffect(() => {
    _listeners.add(setReduced);
    return () => { _listeners.delete(setReduced); };
  }, []);
  return reduced;
}

export function getReducedMotion(): boolean {
  return _reducedMotion;
}

// Helper — returns duration 0 if reduced motion, else original
export function motionDuration(ms: number): number {
  return _reducedMotion ? 0 : ms;
}

// Helper — returns spring config with no animation if reduced
export function motionSpring(config: object): object {
  if (_reducedMotion) return { ...config, duration: 0, speed: 1000 };
  return config;
}
