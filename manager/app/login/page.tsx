"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LockKeyhole, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setError(data.message || '密码校验失败，请再试一次。');
        return;
      }

      router.replace('/');
      router.refresh();
    } catch {
      setError('登录通道暂时断开，请稍后再试。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/40 via-white to-pink-200/40 dark:from-indigo-950/50 dark:via-slate-950 dark:to-purple-950/50" />
      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 rounded-3xl shadow-xl p-10"
      >
        <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-indigo-500/10 flex items-center justify-center shadow-inner">
          <LockKeyhole className="text-indigo-500" size={30} />
        </div>
        <div className="text-center mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-3 flex items-center justify-center gap-2">
            <Sparkles size={12} /> XH Admin Gate
          </p>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">进入星港控制台</h1>
          <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">请输入管理密码，确认是舰长本人。</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="text-[10px] font-black text-slate-400 uppercase ml-1">管理密码</span>
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoFocus
              className="mt-2 w-full bg-white/60 dark:bg-slate-900/60 border border-white/50 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white shadow-inner"
              placeholder="输入秘密口令..."
            />
          </label>

          {error && <p className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs font-bold text-red-500">❌ {error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-indigo-500 text-white text-sm font-black shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? '正在校验星钥...' : '✨ 解锁管理台'}
          </button>
        </form>
      </motion.section>
    </main>
  );
}
