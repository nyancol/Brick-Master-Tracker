import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "lute";

function readPref(): boolean {
  try {
    return localStorage.getItem("lute") === "on";
  } catch {
    return false;
  }
}

export function useLute() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio("/audio/lute.mp3");
    audio.loop = true;
    audio.volume = 0.55;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => {
        setPlaying(true);
        try {
          localStorage.setItem("lute", "on");
        } catch {
          /* private mode */
        }
      }).catch(() => {
        setPlaying(false);
      });
    } else {
      audio.pause();
      setPlaying(false);
      try {
        localStorage.setItem("lute", "off");
      } catch {
        /* private mode */
      }
    }
  }, []);

  return { playing, toggle };
}
