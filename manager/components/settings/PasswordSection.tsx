"use client";

import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { cmsJson } from '@/lib/cmsApi';
import { useToast } from '../ToastProvider';
import { KeyRound, Sparkles } from 'lucide-react';

export default function PasswordSection() {
  const { showToast } = useToast();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!oldPassword || !newPassword) {
      showToast('旧密码和新密码都要填写哦', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('两次输入的新密码不一致', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const data = await cmsJson<{ success: boolean; message?: string }>('/api/auth/change_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', old_password: oldPassword, new_password: newPassword }),
      });
      if (data.success) {
        showToast(data.message || '管理密码已更新', 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(data.message || '修改失败，请检查旧密码', 'error');
      }
    } catch (error: any) {
      showToast(`${error.message || '修改密码失败'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.section initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-2xl">
      <h2 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-2"><KeyRound size={20} className="text-indigo-500" /> 管理密码</h2>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
        <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="当前密码" className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none text-slate-700 dark:text-slate-200" />
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="新密码" className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none text-slate-700 dark:text-slate-200" />
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="再次输入新密码" className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none text-slate-700 dark:text-slate-200" />
        <button disabled={isSaving} className="w-full py-3 bg-indigo-500 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-indigo-600 shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
          {isSaving ? '正在更新星钥...' : <><Sparkles size={16} /> 修改管理密码</>}
        </button>
      </form>
    </motion.section>
  );
}
