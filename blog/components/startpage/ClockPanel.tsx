"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { siteConfig } from '../../siteConfig';

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

function greetingFor(hour: number) {
  if (hour < 5) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 23) return '晚上好';
  return '夜深了';
}

type Hitokoto = { text: string; from: string };

export default function ClockPanel() {
  const [now, setNow] = useState<Date | null>(null);
  const [hitokoto, setHitokoto] = useState<Hitokoto | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/hitokoto', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.text) setHitokoto(data as Hitokoto);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const hours = now ? pad(now.getHours()) : '--';
  const minutes = now ? pad(now.getMinutes()) : '--';
  const seconds = now ? pad(now.getSeconds()) : '--';
  const dateLine = now
    ? `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 · ${WEEKDAYS[now.getDay()]}`
    : '\u00a0';
  const greeting = now ? greetingFor(now.getHours()) : '\u00a0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="flex flex-col items-center text-center select-none"
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

      <h1
        suppressHydrationWarning
        className="mt-1 text-lg sm:text-xl font-bold text-slate-800 dark:text-white"
      >
        {greeting}，{siteConfig.authorName}
      </h1>

      <div className="mt-2 h-10 flex items-center justify-center px-4">
        {hitokoto && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-xs sm:text-sm text-slate-600/85 dark:text-slate-300/85 italic max-w-2xl line-clamp-2"
          >
            「{hitokoto.text}」
            <span className="not-italic opacity-70"> —— {hitokoto.from}</span>
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
