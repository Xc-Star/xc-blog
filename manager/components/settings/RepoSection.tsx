"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, Server } from 'lucide-react';
import { cmsJson } from '@/lib/cmsApi';

type SyncStatus = {
  success: boolean;
  message?: string;
  status?: string;
  details?: string;
};

export default function RepoSection() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastMessage, setLastMessage] = useState('等待与共享内容卷握手...');

  const loadStatus = async () => {
    setIsChecking(true);
    try {
      const data = await cmsJson<SyncStatus>('/api/sync/check', { method: 'POST' });
      setStatus(data);
      setLastMessage(data.message || (data.success ? '✅ 共享卷状态正常' : '⚠️ 共享卷需要检查'));
    } catch (error: any) {
      setStatus({ success: false, message: error.message });
      setLastMessage(error.message || '共享卷状态读取失败');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <motion.section initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-2xl relative z-10 overflow-hidden">
      <div className="absolute -top-24 -right-24 w-56 h-56 bg-indigo-500/10 blur-3xl rounded-full" />
      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">🚀 站点发布</h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2">内容写入数据库后，博客端会即时读取；这里只负责健康检查。</p>
          </div>
          <button onClick={loadStatus} disabled={isChecking} className="px-4 py-2 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-slate-700/50 text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/70 transition-all active:scale-95 flex items-center gap-2">
            <RefreshCcw size={14} className={isChecking ? 'animate-spin text-indigo-500' : 'text-indigo-500'} />
            {isChecking ? '探测中...' : '重新探测'}
          </button>
        </div>

        <div className="bg-slate-50/70 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-inner">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${status?.success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
              <Server size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Status</p>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">{status?.success ? '数据库已就绪' : '等待数据库确认'}</h3>
            </div>
          </div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">{lastMessage}</p>
          {status?.details && <p className="mt-3 text-xs text-slate-400 font-mono break-all">{status.details}</p>}
        </div>
      </div>
    </motion.section>
  );
}
