"use client";
import { cmsJson } from '@/lib/cmsApi';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRound, AppWindow, Orbit, Music2, Images, Puzzle, Zap, PawPrint, KeyRound, Rocket, RefreshCw, Inbox } from 'lucide-react';
import { siteConfig } from '../../siteConfig';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { ToastProvider, useToast } from '../../components/ToastProvider';

import ProfileSection from '../../components/settings/ProfileSection';
import BackgroundSection from '../../components/settings/BackgroundSection';
import MusicSection from '../../components/settings/MusicSection';
import GallerySection from '../../components/settings/GallerySection';
import RepoSection from '../../components/settings/RepoSection';
import DisplaySection from '../../components/settings/DisplaySection';
import DanmakuSection from '../../components/settings/DanmakuSection';
import FooterSection from '../../components/settings/FooterSection';
// 引入刚写的 AI 配置组件
import AICatSection from '../../components/settings/AICatSection';
import PasswordSection from '../../components/settings/PasswordSection';

// 输入框的临时状态，不属于站点配置；带上会被后端字段白名单整体拒绝
const LOCAL_ONLY_FIELDS = ['newMusicId', 'newBgUrl'];

function SettingsContent() {
  const [activeTab, setActiveTab] = useState('profile');
  const { showToast } = useToast();

  const [formData, setFormData] = useState<any>({
    authorName: siteConfig.authorName || "",
    bio: siteConfig.bio || "",
    avatarUrl: siteConfig.avatarUrl || "",
    social: siteConfig.social || {},
    cloudMusicIds: [...(siteConfig.cloudMusicIds || [])],
    bgImages: [...(siteConfig.bgImages || [])],
    newMusicId: '',
    danmakuList: [...(siteConfig.danmakuList || [])],
    buildDate: siteConfig.buildDate || "2026-03-23T00:00:00",
    icpConfig: siteConfig.icpConfig || { name: "", link: "" },
    footerBadges: [...(siteConfig.footerBadges || [])],
    // 初始化小猫 AI 配置数据
    geminiConfig: siteConfig.geminiConfig || {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      modelId: '',
      systemPrompt: '',
      maxOutputTokens: 150,
      temperature: 0.85
    }
  });

  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [musicDetails, setMusicDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchRealConfig = async () => {
      try {
        const data = await cmsJson<{ success: boolean; message?: string; data?: any }>('/api/config/get');

        if (data.success && data.data) {
          console.log("成功从后端拉取到真实配置:", data.data);
          setFormData((prev: any) => ({
            ...prev,
            ...data.data,
            social: { ...(prev.social || {}), ...(data.data.social || {}) },
            danmakuList: data.data.danmakuList ? [...data.data.danmakuList] : prev.danmakuList,
            buildDate: data.data.buildDate || prev.buildDate,
            icpConfig: data.data.icpConfig || prev.icpConfig,
            footerBadges: data.data.footerBadges ? [...data.data.footerBadges] : prev.footerBadges,
            // 合并后端发来的小猫配置
            geminiConfig: { ...(prev.geminiConfig || {}), ...(data.data.geminiConfig || {}) }
          }));
        } else {
          console.error("后端返回失败:", data.message);
          showToast("读取后端配置失败，当前显示为本地静态数据", "warning");
        }
      } catch (error) {
        console.error("请求后端配置通道断开:", error);
        showToast("无法连接到 Python 后端服务", "error");
      }
    };

    fetchRealConfig();
  }, []);

  const handleUpdate = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const fetchMusicDetail = async (id: string) => {
    try {
      const data = await cmsJson<{ success: boolean; data?: any }>(`/api/music/query/${id}`);
      return data.success ? data.data : { error: true, id, name: "查询失败或无版权" };
    } catch (error) {
      return { error: true, id, name: "后端通信通道断开" };
    }
  };

  useEffect(() => {
    const loadInitialMusicDetails = async () => {
      const details: Record<string, any> = { ...musicDetails };
      let hasUpdate = false;
      for (const id of formData.cloudMusicIds || []) {
        if (!details[id]) {
          const info = await fetchMusicDetail(id);
          if (info) {
            details[id] = info;
            hasUpdate = true;
          }
        }
      }
      if (hasUpdate) setMusicDetails(details);
    };
    if (formData.cloudMusicIds?.length > 0) {
      loadInitialMusicDetails();
    }
  }, [formData.cloudMusicIds]);

  const queryMusic = async () => {
    if (!formData.newMusicId) {
      showToast("ID不能为空哦", "warning");
      return;
    }
    setQueryLoading(true);
    setQueryResult(null);

    const info = await fetchMusicDetail(formData.newMusicId);
    if (info && !info.error) {
      setQueryResult(info);
      showToast("获取成功！", "success");
    } else {
      showToast(info?.name || "未找到该歌曲", "error");
    }
    setQueryLoading(false);
  };

  const removeSong = (index: number) => {
    const newList = [...formData.cloudMusicIds];
    newList.splice(index, 1);
    handleUpdate('cloudMusicIds', newList);
    showToast("已移除一首歌曲", "success");
  };

  const confirmAddMusic = () => {
    if (!queryResult) return;
    const targetId = String(queryResult.id);
    const exists = formData.cloudMusicIds.some((id: string | number) => String(id) === targetId);

    if (exists) {
      showToast(`《${queryResult.name}》已经在列表里啦，不要重复添加！`, "warning");
    } else {
      handleUpdate('cloudMusicIds', [...formData.cloudMusicIds, targetId]);
      setMusicDetails(prev => ({ ...prev, [targetId]: queryResult }));
      setQueryResult(null);
      handleUpdate('newMusicId', '');
      showToast("成功存入播放列表！", "success");
    }
  };

  const saveConfig = async (label: string) => {
    const updates = { ...formData };
    LOCAL_ONLY_FIELDS.forEach(field => delete updates[field]);
    try {
      const data = await cmsJson<{ success: boolean; message?: string }>('/api/config/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      if (data.success) {
        showToast(`【${label}】已保存，前台已生效`, "success");
      } else {
        showToast(`保存失败：${data.message}`, "error");
      }
    } catch (error: any) {
      showToast(`保存失败：${error.message}`, "error");
    }
  };

  // 在菜单里增加 AI 猫咪入口
  const menuItems = [
    { id: 'profile', name: '个人名片设置', Icon: UserRound },
    { id: 'display', name: '视窗画面设置', Icon: AppWindow },
    { id: 'background', name: '视觉背景配置', Icon: Orbit },
    { id: 'music', name: '音乐播放设置', Icon: Music2 },
    { id: 'gallery', name: '图库配置管理', Icon: Images },
    { id: 'footer', name: '首页底部设置', Icon: Puzzle },
    { id: 'danmaku', name: '全站弹幕设置', Icon: Zap },
    { id: 'aicat', name: 'AI 煤球配置', Icon: PawPrint },
    { id: 'password', name: '管理密码', Icon: KeyRound },
    { id: 'repo', name: '项目仓库设置', Icon: Rocket },
  ];

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />

      <PageTransition>
        <main className="w-[95%] max-w-7xl mx-auto mt-24 flex flex-col md:flex-row gap-8 items-start relative z-10">

          <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-3xl p-4 shadow-xl">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-4 ml-2 tracking-widest">系统管理维度</p>
              <nav className="flex flex-col gap-2">
                {menuItems.map((item) => (
                  <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm ${activeTab === item.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 translate-x-1' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}>
                    <item.Icon size={16} className="shrink-0" />{item.name}
                  </button>
                ))}
              </nav>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 mt-4">
              <p className="text-xs font-black text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5"><RefreshCw size={14} /> 数据中枢操作</p>
              <button className="w-full py-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold hover:bg-amber-500 hover:text-white transition-all text-left px-4 flex justify-between items-center">
                <span>拉取 my-blog 数据</span><Inbox size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && <ProfileSection key="profile" formData={formData} handleUpdate={handleUpdate} saveConfig={saveConfig} />}
              {activeTab === 'display' && <DisplaySection key="display" />}
              {activeTab === 'background' && <BackgroundSection key="background" formData={formData} handleUpdate={handleUpdate} saveConfig={saveConfig} />}
              {activeTab === 'music' && <MusicSection key="music" formData={formData} handleUpdate={handleUpdate} saveConfig={saveConfig} musicDetails={musicDetails} queryMusic={queryMusic} queryLoading={queryLoading} queryResult={queryResult} confirmAddMusic={confirmAddMusic} removeSong={removeSong} />}
              {activeTab === 'gallery' && <GallerySection key="gallery" formData={formData} handleUpdate={handleUpdate} saveConfig={saveConfig} />}
              {activeTab === 'footer' && <FooterSection key="footer" formData={formData} handleUpdate={handleUpdate} saveConfig={saveConfig} />}
              {activeTab === 'danmaku' && <DanmakuSection key="danmaku" formData={formData} handleUpdate={handleUpdate} saveConfig={saveConfig} />}
              {/* 挂载 AI 猫咪面板 */}
              {activeTab === 'aicat' && <AICatSection key="aicat" formData={formData} handleUpdate={handleUpdate} saveConfig={saveConfig} />}
              {activeTab === 'password' && <PasswordSection key="password" />}

              {activeTab === 'repo' && <RepoSection key="repo" />}
            </AnimatePresence>
          </div>

        </main>
      </PageTransition>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ToastProvider>
      <SettingsContent />
    </ToastProvider>
  );
}
