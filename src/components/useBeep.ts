"use client";

import { useCallback, useEffect, useRef } from "react";

type AudioContextCtor = typeof AudioContext;

/**
 * Tiny WebAudio beeper for countdowns. Browsers only allow sound after a user
 * gesture, so call `unlock()` from a click handler (e.g. the Start button).
 */
export function useBeep() {
  const ctxRef = useRef<AudioContext | null>(null);

  const unlock = useCallback(() => {
    try {
      if (!ctxRef.current) {
        const Ctor: AudioContextCtor | undefined =
          window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
        if (Ctor) ctxRef.current = new Ctor();
      }
      void ctxRef.current?.resume();
    } catch {
      /* audio not available — timers still work silently */
    }
  }, []);

  const beep = useCallback((frequency = 880, durationMs = 120) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + durationMs / 1000 + 0.02);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    return () => {
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  return { unlock, beep };
}
