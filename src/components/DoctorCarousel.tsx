import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { DoctorWithCount } from '../types';
import DoctorFolderCard from './DoctorFolderCard';

interface Props {
  doctors: DoctorWithCount[];
}

/**
 * Horizontally scrolling row of doctor availability cards. When the cards
 * overflow the container, animated arrow buttons fade in to page through
 * them one viewport at a time with a smooth scroll.
 */
export const DoctorCarousel: React.FC<Props> = ({ doctors }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Recompute which arrows should show based on current scroll position.
  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 4);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, doctors.length]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // Page by ~90% of the viewport so a sliver of the next card stays visible.
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Left arrow */}
      <AnimatePresence>
        {canLeft && (
          <motion.button
            type="button"
            key="left"
            onClick={() => scrollByPage(-1)}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 text-slate-600 hover:text-sky-600"
            aria-label="Previous doctors"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scrolling track */}
      <div
        ref={trackRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory py-1"
      >
        {doctors.map((doc, i) => (
          <motion.div
            key={doc._id || doc.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 6) * 0.06 }}
            className="snap-start shrink-0 w-[240px]"
          >
            <DoctorFolderCard doctor={doc} active={i === 0} />
          </motion.div>
        ))}
      </div>

      {/* Right arrow */}
      <AnimatePresence>
        {canRight && (
          <motion.button
            type="button"
            key="right"
            onClick={() => scrollByPage(1)}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 text-slate-600 hover:text-sky-600"
            aria-label="Next doctors"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorCarousel;
