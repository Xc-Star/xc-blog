"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, Server, Sparkles } from 'lucide-react';
import { cmsJson } from '@/lib/cmsApi';
import { useToast } from '../ToastProvider';

type SyncStatus = {
  success: boolean;
  message?: string;
  status?: string;
  details?: string;
};

export default function RepoSection() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastMessage, setLastMessage] = useState('等待与共享内容卷握手...');

  const loadStatus = async () => {
    setIsChecking(true);
    try {
      const data = await cmsJson<SyncStatus>('/api/sync/check');
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

  const refreshCache = async () => {
    setIsRefreshing(true);
    showToast('🚀 正在通知博客刷新缓存...', 'info');
    try {
      const data = await cmsJson<SyncStatus>('/api/sync/execute', { method: 'POST' });
      setStatus(data);
      setLastMessage(data.message || '✅ 博客缓存刷新完成');
      showToast(data.message || '✅ 博客缓存刷新完成', data.success ? 'success' : 'error');
    } catch (error: any) {
      const message = error.message || '刷新请求失败';
      setLastMessage(message);
      showToast(`❌ ${message}`, 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <motion.section initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-2xl relative z-10 overflow-hidden">
      <div className="absolute -top-24 -right-24 w-56 h-56 bg-indigo-500/10 blur-3xl rounded-full" />
      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">🚀 站点发布</h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2">内容写入共享卷后，博客端会即时读取；这里只负责健康检查与缓存刷新。</p>
          </div>
          <button onClick={loadStatus} disabled={isChecking} className="px-4 py-2 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-slate-700/50 text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/70 transition-all active:scale-95 flex items-center gap-2">
            <RefreshCcw size={14} className={isChecking ? 'animate-spin text-indigo-500' : 'text-indigo-500'} />
            {isChecking ? '探测中...' : '重新探测'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-slate-50/70 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-inner">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${status?.success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                <Server size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shared Volume Status</p>
                <h3 className="text-lg font-black text-slate-800 dark:text-white">{status?.success ? '共享卷已就绪' : '等待共享卷确认'}</h3>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">{lastMessage}</p>
            {status?.details && <p className="mt-3 text-xs text-slate-400 font-mono break-all">{status.details}</p>}
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 flex flex-col justify-between gap-5">
            <div>
              <Sparkles className="text-indigo-500 mb-4" size={26} />
              <h3 className="text-base font-black text-slate-800 dark:text-white mb-2">刷新博客缓存</h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">无需 Git 推送，也无需 Vercel 重建。点击后让博客端重新装载共享卷内容。</p>
            </div>
            <button onClick={refreshCache} disabled={isRefreshing} className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isRefreshing ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '✨'}
              {isRefreshing ? '刷新中...' : '立即刷新站点'}
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
