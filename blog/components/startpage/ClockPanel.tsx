"use client";

import { motion } from 'framer-motion';

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

export default function ClockPanel({ now, compact = false }: { now: Date | null; compact?: boolean }) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const hours = now ? pad(now.getHours()) : '--';
  const minutes = now ? pad(now.getMinutes()) : '--';
  const seconds = now ? pad(now.getSeconds()) : '--';
  const dateLine = now
    ? `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 · ${WEEKDAYS[now.getDay()]}`
    : '\u00a0';

  return (
    <motion.div layout="position" className="pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: compact ? 0.75 : 1, y: 0, scale: compact ? 0.88 : 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center text-center select-none origin-bottom"
      >
        <div
          suppressHydrationWarning
          className="flex items-baseline gap-1 sm:gap-2 font-black tracking-tighter text-slate-800 dark:text-white drop-shadow-[0_4px_24px_rgba(255,255,255,0.45)] dark:drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
        >
          <span className="text-6xl sm:text-7xl lg:text-8xl tabular-nums">{hours}</span>
          <span className="text-5xl sm:text-6xl lg:text-7xl text-indigo-500 animate-pulse">:</span>
          <span className="text-6xl sm:text-7xl lg:text-8xl tabular-nums">{minutes}</span>
          <span className="text-2xl sm:text-3xl lg:text-4xl text-slate-600/80 dark:text-slate-300/80 tabular-nums ml-1">
            {seconds}
          </span>
        </div>

        <p
          suppressHydrationWarning
          className="mt-3 text-sm sm:text-base font-bold text-slate-700/90 dark:text-slate-200/90"
        >
          {dateLine}
        </p>
      </motion.div>
    </motion.div>
  );
}
