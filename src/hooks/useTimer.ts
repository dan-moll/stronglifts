import { useState, useRef, useCallback, useEffect } from 'react';

export function useTimer(defaultSeconds: number) {
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const durationRef = useRef(0);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
    setRemaining(0);
  }, []);

  const start = useCallback(
    (seconds?: number) => {
      stop();
      const dur = seconds ?? defaultSeconds;
      durationRef.current = dur;
      startTimeRef.current = Date.now();
      setRemaining(dur);
      setRunning(true);

      intervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const left = Math.max(0, durationRef.current - elapsed);
        setRemaining(Math.ceil(left));
        if (left <= 0) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setRunning(false);
          // Vibrate + beep
          try {
            navigator.vibrate?.(300);
          } catch { /* ignore */ }
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.value = 0.3;
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          } catch { /* ignore */ }
        }
      }, 250);
    },
    [defaultSeconds, stop]
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  return { remaining, running, start, stop, total: durationRef.current } as const;
}
