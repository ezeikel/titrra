'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

type StaggerItemProps = {
  children: ReactNode;
  direction?: Direction;
  distance?: number;
  duration?: number;
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

// A single item inside <StaggerChildren>. Inherits the container's stagger.
const StaggerItem = ({
  children,
  direction = 'up',
  distance = 24,
  duration = 0.5,
  className,
}: StaggerItemProps) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  const offset = offsetFor(direction, distance);
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: offset.x, y: offset.y },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration, ease: [0.25, 0.1, 0.25, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default StaggerItem;
