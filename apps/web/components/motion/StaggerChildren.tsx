'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

type StaggerChildrenProps = {
  children: ReactNode;
  staggerDelay?: number;
  delay?: number;
  once?: boolean;
  amount?: number;
  className?: string;
};

const containerVariants = {
  hidden: {},
  visible: (custom: { staggerDelay: number; delay: number }) => ({
    transition: {
      staggerChildren: custom.staggerDelay,
      delayChildren: custom.delay,
    },
  }),
};

// Container that staggers its <StaggerItem> children into view.
const StaggerChildren = ({
  children,
  staggerDelay = 0.1,
  delay = 0,
  once = true,
  amount = 0.2,
  className,
}: StaggerChildrenProps) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      custom={{ staggerDelay, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default StaggerChildren;
