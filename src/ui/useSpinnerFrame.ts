import { useEffect, useState } from "react";

export const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;
export const SPINNER_INTERVAL_MS = 80;

export function useSpinnerFrame(): string {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setI((n) => (n + 1) % SPINNER_FRAMES.length);
    }, SPINNER_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
  return SPINNER_FRAMES[i] ?? SPINNER_FRAMES[0];
}
