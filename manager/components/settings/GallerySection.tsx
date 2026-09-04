import { cmsJson } from '@/lib/cmsApi';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../ToastProvider';
import { Image as ImageIcon, Radar, CircleCheck, CircleX } from 'lucide-react';

export default function GallerySection({ formData, handleUpdate, saveConfig }: any) {
  const { showToast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean, msg: string } | null>(null);

  const handleTestConnection = async () => {
    const url = formData.picBedUrl;
    const token = formData.picBedToken;

    if (!url || !token) {
      showToast("请完整填写图床 API 地址和 TOKEN！", "warning");
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    showToast("正在上传一张 1x1 测试图验证连通性...", "info");

    try {
      const data = await cmsJson<{ success: boolean; message: string }>('/api/picbed/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, token })
      });

      setTestResult({ success: data.success, msg: data.message });

      if (data.success) {
        showToast("测试通过！图床已就绪", "success");
      } else {
        showToast("Token 无效或服务异常", "error");
      }
    } catch (error) {
      showToast("无法连接到本地 Python 引擎", "error");
      setTestResult({ success: false, msg: "桌面引擎连接失败，请检查终端日志" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!formData.picBedUrl || !formData.picBedToken) {
      showToast("API 地址和 TOKEN 不能为空，无法保存！", "error");
      return;
    }
    saveConfig('图床配置');
  };

  return (
    <motion.section initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-2xl">
      <h2 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-2"><ImageIcon size={20} className="text-pink-500" /> 图床引擎设置</h2>

      <div className="max-w-xl space-y-6">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">图床名称标识</label>
          <input
            type="text"
            value={formData.picBedName}
            onChange={e => handleUpdate('picBedName', e.target.value)}
            className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none mt-1 font-bold text-slate-700 dark:text-slate-200"
          />
        </div>

        {/* 彻底解耦的 API 地址输入框 */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">API 接口地址 (URL)</label>
          <input
            type="text"
            placeholder="例如: https://pic.dusays.com"
            value={formData.picBedUrl || ''}
            onChange={e => handleUpdate('picBedUrl', e.target.value)}
            className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none mt-1 text-slate-700 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">API TOKEN (鉴权密钥)</label>
          <input
            type="password"
            placeholder="上传认证码或 API Token（需 upload 权限）"
            value={formData.picBedToken || ''}
            onChange={e => handleUpdate('picBedToken', e.target.value)}
            className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none mt-1 text-slate-700 dark:text-slate-200"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className={`flex-1 py-3 rounded-2xl text-sm font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
              ${isTesting ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-pink-500 text-white hover:bg-pink-600 shadow-pink-500/30'}`}
          >
            {isTesting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : <><Radar size={16} /> 发送探针测试 Token</>}
          </button>

          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-indigo-500 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-indigo-600 shadow-indigo-500/30 transition-all active:scale-95"
          >
            保存图床配置
          </button>
        </div>

        <AnimatePresence>
          {testResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${testResult.success ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'}`}>
                {testResult.success ? <CircleCheck size={20} className="shrink-0" /> : <CircleX size={20} className="shrink-0" />}
                <span className="text-sm font-bold leading-relaxed">{testResult.msg}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.section>
  );
}
