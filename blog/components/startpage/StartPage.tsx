"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import ClockPanel from './ClockPanel';
import Greeting, { type Hitokoto } from './Greeting';
import SearchLauncher from './SearchLauncher';
import { siteConfig } from '../../siteConfig';

const EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: 'spring' as const, stiffness: 190, damping: 26, mass: 0.9 };

export default function StartPage() {
  const [now, setNow] = useState<Date | null>(null);
  const [hitokoto, setHitokoto] = useState<Hitokoto | null>(null);
  const [searchExpanded, setSearchExpanded] = useState(false);

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

  return (
    <MotionConfig transition={SPRING} reducedMotion="user">
      <div
        className={`w-full flex flex-col items-center gap-6 sm:gap-8 px-4 sm:px-6 pt-24 sm:pt-28 min-h-[100svh] ${
          searchExpanded ? 'pb-24 sm:pb-28' : 'justify-center pb-16'
        }`}
      >
        {/* 展开时上下两块等高，搜索框落在垂直中线；容器高度不确定，百分比 basis 会退化成 auto，所以用 0px */}
        <div
          className={`w-full flex flex-col items-center gap-4 ${
            searchExpanded ? 'flex-[1_1_0px] justify-end' : ''
          }`}
        >
          <ClockPanel now={now} compact={searchExpanded} />
          {!searchExpanded && <Greeting layoutId="start-greeting" now={now} hitokoto={hitokoto} />}
        </div>

        <SearchLauncher expanded={searchExpanded} onExpandedChange={setSearchExpanded} />

        <div
          className={`relative w-full flex flex-col items-center gap-3 ${
            searchExpanded ? 'flex-[1_1_0px] justify-start' : ''
          }`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {!searchExpanded && (
              <motion.div
                key="links"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12, transition: { duration: 0.18, ease: EASE } }}
                className="flex flex-col items-center gap-3"
              >
                <Link
                  href="/home"
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/50 dark:border-white/10 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-lg hover:scale-105 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300"
                >
                  进入 {siteConfig.navTitle || siteConfig.authorName} 的博客
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <p className="text-[11px] text-slate-500/80 dark:text-slate-400/80">
                  按 <kbd className="px-1.5 py-0.5 rounded bg-white/60 dark:bg-slate-700/60 font-mono">/</kbd> 或{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-white/60 dark:bg-slate-700/60 font-mono">Ctrl K</kbd> 聚焦搜索框
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {searchExpanded && <Greeting layoutId="start-greeting" now={now} hitokoto={hitokoto} />}
        </div>
      </div>
    </MotionConfig>
  );
}
