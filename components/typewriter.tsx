import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface TypewriterProps {
  text: string
  speed?: number // ms per character
  eraseSpeed?: number // ms per character when erasing
  pause?: number // ms to pause before erasing
  loop?: boolean
}

export default function Typewriter({ text, speed = 120, eraseSpeed = 60, pause = 1200, loop = true }: TypewriterProps) {
  const [displayed, setDisplayed] = useState("");
  const [isErasing, setIsErasing] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (!isErasing && index < text.length) {
      timeout = setTimeout(() => {
        setDisplayed(text.slice(0, index + 1));
        setIndex(index + 1);
      }, speed);
    } else if (!isErasing && index === text.length) {
      timeout = setTimeout(() => setIsErasing(true), pause);
    } else if (isErasing && index > 0) {
      timeout = setTimeout(() => {
        setDisplayed(text.slice(0, index - 1));
        setIndex(index - 1);
      }, eraseSpeed);
    } else if (isErasing && index === 0) {
      if (loop) {
        timeout = setTimeout(() => {
          setIsErasing(false);
        }, pause / 2);
      }
    }
    return () => clearTimeout(timeout);
  }, [index, isErasing, text, speed, eraseSpeed, pause, loop]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-bold text-7xl md:text-8xl lg:text-9xl text-primary"
      style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
    >
      {displayed}
      <span className="animate-blink">|</span>
      <style jsx>{`
        .animate-blink {
          animation: blink 1s steps(2, start) infinite;
        }
        @keyframes blink {
          to { opacity: 0; }
        }
      `}</style>
    </motion.span>
  );
}
