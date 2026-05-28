import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn("w-full h-full", className)}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
