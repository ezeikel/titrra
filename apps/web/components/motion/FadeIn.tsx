'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

type FadeInProps = {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  amount?: number;
  className?: string;
};

const offsetFor = (direction: Direction, distance: number) => {
  switch (direction) {
    case 'up':
      return { x: 0, y: distance };
    case 'down':
      return { x: 0, y: -distance };
    case 'left':
      return { x: distance, y: 0 };
    case 'right':
      return { x: -distance, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
};

// Reveal-on-scroll wrapper. Respects prefers-reduced-motion (renders static).
const FadeIn = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  distance = 24,
  once = true,
  amount = 0.3,
  className,
}: FadeInProps) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  const offset = offsetFor(direction, distance);
  return (
    <motion.div
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default FadeIn;
