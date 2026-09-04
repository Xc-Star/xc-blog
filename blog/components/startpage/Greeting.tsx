"use client";

import { motion } from 'framer-motion';

import { siteConfig } from '../../siteConfig';

export type Hitokoto = { text: string; from: string };

function greetingFor(hour: number) {
  if (hour < 5) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 23) return '晚上好';
  return '夜深了';
}

export default function Greeting({
  now,
  hitokoto,
  layoutId,
}: {
  now: Date | null;
  hitokoto: Hitokoto | null;
  layoutId?: string;
}) {
  const greeting = now ? greetingFor(now.getHours()) : '\u00a0';

  return (
    <motion.div
      layoutId={layoutId}
      initial={{ opacity: 0.35 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center text-center select-none pointer-events-none"
    >
      <h1
        suppressHydrationWarning
        className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white"
      >
        {greeting}，{siteConfig.authorName}
      </h1>

      <div className="mt-2 h-10 flex items-center justify-center px-4">
        {hitokoto && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
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
