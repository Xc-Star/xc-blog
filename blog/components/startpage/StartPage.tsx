"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import ClockPanel from './ClockPanel';
import SearchLauncher from './SearchLauncher';
import { siteConfig } from '../../siteConfig';

export default function StartPage() {
  return (
    <div className="w-full flex flex-col items-center justify-center px-4 sm:px-6 pt-24 sm:pt-28 pb-16 min-h-[100svh]">
      <div className="w-full max-w-3xl flex flex-col items-center gap-6 sm:gap-8">
        <ClockPanel />
        <SearchLauncher />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
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
      </div>
    </div>
  );
}
