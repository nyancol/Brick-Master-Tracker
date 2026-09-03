import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "sfx";

function readPref(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "on";
  } catch {
    return true;
  }
}

export function useSfx() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(readPref);

  useEffect(() => {
    const audio = new Audio("/audio/sword-shing.wav");
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      /* private mode */
    }
  }, [enabled]);

  const play = useCallback(() => {
    if (!readPref()) return;
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.currentTime = 0;
      void audio.play().catch(() => {
        /* autoplay or decode failure — stay silent */
      });
    } catch {
      /* noop */
    }
  }, []);

  return { enabled, toggle, play };
}
