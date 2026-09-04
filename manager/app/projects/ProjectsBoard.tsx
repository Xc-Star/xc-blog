"use client";

import { cmsJson } from '@/lib/cmsApi';
import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '../../components/BackButton';
import { projectsData as initialProjects, projectCategories as initialCategories, Project, ProjectCategory, UNCATEGORIZED_LABEL, findCategoryName } from '../../data/projects';
import { Plus, Pencil, Trash2, AlertTriangle, Save, Edit3, X, Sparkles, Code2, ChevronDown, ExternalLink, FolderCog } from 'lucide-react';
import { useToast } from '../../components/ToastProvider';
import ProjectIcon, { PROJECT_ICON_OPTIONS, DEFAULT_PROJECT_ICON, resolveProjectIconKey } from '../../components/ProjectIcon';

export default function ProjectsBoard() {
  const { showToast } = useToast();

  // 1. 核心状态
  const [editableProjects, setEditableProjects] = useState<Project[]>(initialProjects);
  const [categories, setCategories] = useState<ProjectCategory[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    cmsJson<{ success: boolean; data?: Project[]; categories?: ProjectCategory[]; message?: string }>('/api/projects/list')
      .then(data => {
        if (cancelled || !data.success) return;
        if (Array.isArray(data.data)) setEditableProjects(data.data);
        if (Array.isArray(data.categories)) setCategories(data.categories);
      })
      .catch(error => showToast(`项目读取失败：${error.message}`, "error"));
    return () => { cancelled = true; };
  }, [showToast]);

  // 2. 弹窗状态
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string | null }>({ isOpen: false, id: null, name: null });
  const [projectModal, setProjectModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; data: Partial<Project> }>({ isOpen: false, mode: 'add', data: {} });
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);
  const categoryPickerRef = useRef<HTMLDivElement>(null);
  const activeIconKey = resolveProjectIconKey(projectModal.data.icon);
  const activeIconLabel = PROJECT_ICON_OPTIONS.find(o => o.key === activeIconKey)?.label ?? '';

  useEffect(() => {
    if (!iconPickerOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!iconPickerRef.current?.contains(event.target as Node)) setIconPickerOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [iconPickerOpen]);

  useEffect(() => {
    if (!categoryPickerOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!categoryPickerRef.current?.contains(event.target as Node)) setCategoryPickerOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [categoryPickerOpen]);

  // 3. 搜索过滤逻辑
  const knownCategoryIds = useMemo(() => new Set(categories.map(c => c.id)), [categories]);

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return editableProjects.filter(p => {
      if (activeCategory === '__none') {
        if (knownCategoryIds.has(p.category)) return false;
      } else if (activeCategory !== 'all' && p.category !== activeCategory) {
        return false;
      }
      if (!query) return true;
      return (p.name || "").toLowerCase().includes(query) ||
        (p.description || "").toLowerCase().includes(query) ||
        (p.tags || []).some(t => t.toLowerCase().includes(query));
    });
  }, [searchQuery, activeCategory, editableProjects, knownCategoryIds]);

  const categoryTabs = useMemo(() => {
    const counts = new Map<string, number>();
    let orphan = 0;
    for (const p of editableProjects) {
      if (knownCategoryIds.has(p.category)) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
      else orphan += 1;
    }
    const tabs = [
      { key: 'all', label: '全部', count: editableProjects.length },
      ...categories.map(c => ({ key: c.id, label: c.name || '未命名', count: counts.get(c.id) ?? 0 })),
    ];
    if (orphan > 0) tabs.push({ key: '__none', label: UNCATEGORIZED_LABEL, count: orphan });
    return tabs;
  }, [editableProjects, categories, knownCategoryIds]);

  const syncToQueue = async (nextList: Project[], nextCategories: ProjectCategory[] = categories) => {
    try {
      const data = await cmsJson<{ success: boolean; message?: string }>('/api/projects/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: nextList, categories: nextCategories })
      });
      showToast(data.success ? "已保存，前台已生效" : `保存失败：${data.message}`, data.success ? "success" : "error");
    } catch (error: any) {
      showToast(`保存失败：${error.message}`, "error");
    }
  };

  const addCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories.some(c => c.name === name)) {
      showToast("已经有同名分类了", "warning");
      return;
    }
    const next = [...categories, { id: `cat_${Date.now()}`, name }];
    setCategories(next);
    setNewCategoryName('');
    syncToQueue(editableProjects, next);
  };

  const renameCategory = (id: string, name: string) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, name } : c)));
  };

  const removeCategory = (id: string) => {
    const next = categories.filter(c => c.id !== id);
    setCategories(next);
    if (activeCategory === id) setActiveCategory('all');
    syncToQueue(editableProjects, next);
  };

  const handleSaveProject = () => {
    const { mode, data } = projectModal;
    if (!data.name || !data.githubUrl) {
      showToast("名称和 GitHub 地址是必填项", "warning");
      return;
    }

    let next;
    if (mode === 'add') {
      const newProj: Project = {
        id: `proj_${Date.now()}`,
        name: data.name!,
        githubUrl: data.githubUrl!,
        description: data.description || '暂无描述。',
        icon: resolveProjectIconKey(data.icon),
        category: data.category || '',
        tags: data.tags || ['OpenSource']
      };
      next = [newProj, ...editableProjects];
    } else {
      next = editableProjects.map(p => p.id === data.id ? { ...p, ...data, icon: resolveProjectIconKey(data.icon), category: data.category || '' } as Project : p);
    }
    setEditableProjects(next);
    syncToQueue(next);
    setProjectModal({ isOpen: false, mode: 'add', data: {} });
  };

  const confirmDelete = () => {
    if (!deleteModal.id) return;
    const next = editableProjects.filter(p => p.id !== deleteModal.id);
    setEditableProjects(next);
    syncToQueue(next);
    setDeleteModal({ isOpen: false, id: null, name: null });
  };

  // GitHub 原生 SVG 图标组件
  const GithubIcon = () => (
    <svg className="w-8 h-8 text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );

  const LinkIcon = ({ url }: { url: string }) =>
    /github\.com/i.test(url || '')
      ? <GithubIcon />
      : <ExternalLink className="w-8 h-8 text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors flex-shrink-0" strokeWidth={1.5} />;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-10 py-10 relative z-10">

      {/* 销毁确认弹窗 */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/50 p-10 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6"><AlertTriangle className="text-red-500" /></div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">注销项目？</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed text-balance">确认从矩阵中移除 <span className="font-bold text-red-500">"{deleteModal.name}"</span> 吗？</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase">保留</button>
                <button onClick={confirmDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-xs font-black uppercase shadow-lg">确认移除</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 项目编辑弹窗 */}
      <AnimatePresence>
        {projectModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setProjectModal({ ...projectModal, isOpen: false })} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[40px] border border-white/20 p-8 shadow-2xl">
               <h2 className="text-2xl font-black mb-6 dark:text-white flex items-center gap-2"><Code2 className="text-indigo-500" /> {projectModal.mode === 'add' ? '开启新项目' : '修改项目档案'}</h2>
               <div className="space-y-4">
                 <div className="flex gap-4">
                    <div ref={iconPickerRef} className="relative w-44 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIconPickerOpen(open => !open)}
                        className="w-full flex items-center gap-2 bg-slate-100 dark:bg-black/20 rounded-2xl px-4 py-3 text-left transition hover:ring-2 hover:ring-indigo-500/40"
                      >
                        <ProjectIcon name={activeIconKey} size={22} className="text-indigo-500 shrink-0" />
                        <span className="flex-1 min-w-0 truncate text-xs font-bold text-slate-700 dark:text-slate-200">{activeIconLabel}</span>
                        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${iconPickerOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {iconPickerOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="absolute left-0 top-full mt-2 z-50 w-60 max-h-56 overflow-y-auto grid grid-cols-5 gap-1 p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl"
                          >
                            {PROJECT_ICON_OPTIONS.map(({ key, label, Icon }) => (
                              <button
                                key={key}
                                type="button"
                                title={label}
                                aria-label={label}
                                onClick={() => {
                                  setProjectModal(modal => ({ ...modal, data: { ...modal.data, icon: key } }));
                                  setIconPickerOpen(false);
                                }}
                                className={`aspect-square rounded-xl flex items-center justify-center transition ${key === activeIconKey ? 'bg-indigo-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-500'}`}
                              >
                                <Icon size={18} strokeWidth={1.75} />
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <input type="text" value={projectModal.data.name || ''} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, name: e.target.value}})} className="flex-1 min-w-0 bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none" placeholder="项目名称" />
                 </div>
                 <div ref={categoryPickerRef} className="relative">
                   <button
                     type="button"
                     onClick={() => setCategoryPickerOpen(open => !open)}
                     className="w-full flex items-center gap-2 bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 text-left transition hover:ring-2 hover:ring-indigo-500/40"
                   >
                     <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">分类</span>
                     <span className="flex-1 min-w-0 truncate text-sm font-bold text-slate-700 dark:text-slate-200">
                       {findCategoryName(categories, projectModal.data.category)}
                     </span>
                     <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${categoryPickerOpen ? 'rotate-180' : ''}`} />
                   </button>
                   <AnimatePresence>
                     {categoryPickerOpen && (
                       <motion.div
                         initial={{ opacity: 0, y: -6 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -6 }}
                         className="absolute left-0 right-0 top-full mt-2 z-50 max-h-56 overflow-y-auto p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl"
                       >
                         {[{ id: '', name: UNCATEGORIZED_LABEL }, ...categories].map(({ id, name }) => (
                           <button
                             key={id || '__none'}
                             type="button"
                             onClick={() => {
                               setProjectModal(modal => ({ ...modal, data: { ...modal.data, category: id } }));
                               setCategoryPickerOpen(false);
                             }}
                             className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition ${(projectModal.data.category || '') === id ? 'bg-indigo-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-500'}`}
                           >
                             {name || '未命名'}
                           </button>
                         ))}
                         {categories.length === 0 && (
                           <p className="px-4 py-2 text-xs text-slate-400">还没有分类，先去列表页新建一个。</p>
                         )}
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
                 <input type="text" value={projectModal.data.githubUrl || ''} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, githubUrl: e.target.value}})} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none" placeholder="项目仓库 / 站点链接" />
                 <textarea value={projectModal.data.description || ''} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, description: e.target.value}})} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white h-24 outline-none resize-none focus:ring-2 focus:ring-indigo-500 border-none" placeholder="项目描述..." />
                 <input type="text" value={projectModal.data.tags?.join(', ') || ''} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, tags: e.target.value.split(',').map(t => t.trim())}})} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none" placeholder="技术栈 (逗号分隔)" />
               </div>
               <div className="mt-8 flex gap-3">
                 <button onClick={() => setProjectModal({ ...projectModal, isOpen: false })} className="flex-1 py-3 text-slate-500 font-bold uppercase text-xs">取消</button>
                 <button onClick={handleSaveProject} className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2"><Save size={18} /> 保存</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 分类管理弹窗 */}
      <AnimatePresence>
        {categoryModalOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setCategoryModalOpen(false); syncToQueue(editableProjects); }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[40px] border border-white/20 p-8 shadow-2xl">
              <h2 className="text-2xl font-black mb-2 dark:text-white flex items-center gap-2"><FolderCog className="text-indigo-500" /> 分类管理</h2>
              <p className="text-xs text-slate-500 mb-6">分类名称可直接修改；删除后，原属于它的项目会变为「{UNCATEGORIZED_LABEL}」。</p>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={category.name}
                      onChange={e => renameCategory(category.id, e.target.value)}
                      className="flex-1 min-w-0 bg-slate-100 dark:bg-black/20 rounded-2xl px-4 py-2.5 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="分类名称"
                    />
                    <button
                      type="button"
                      onClick={() => removeCategory(category.id)}
                      aria-label={`删除分类 ${category.name}`}
                      className="w-10 h-10 shrink-0 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-xs text-slate-400 py-4 text-center">还没有任何分类，在下方新建一个吧。</p>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCategory(); }}
                  className="flex-1 min-w-0 bg-slate-100 dark:bg-black/20 rounded-2xl px-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="新分类名称，如：常用站点"
                />
                <button type="button" onClick={addCategory} className="px-5 rounded-2xl bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-1">
                  <Plus size={16} /> 新建
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setCategoryModalOpen(false); syncToQueue(editableProjects); }}
                className="mt-8 w-full py-4 bg-indigo-500 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2"
              >
                <Save size={18} /> 保存并关闭
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 顶部标题区 */}
      <div className="mb-8 flex flex-col items-center md:items-start">
        <div className="w-full flex justify-start mb-6"><BackButton /></div>
        <div className="text-center md:text-left w-full">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-widest uppercase">Projects Matrix</h1>
          <p className="text-slate-600 dark:text-slate-400 font-serif italic opacity-80 flex items-center justify-center md:justify-start gap-2">
            <Sparkles size={14} className="text-indigo-500" /> 开源项目、推荐作品与常用站点
          </p>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="mb-6 flex justify-center w-full">
        <div className="relative w-full max-w-lg group">
          <input type="text" placeholder="搜索项目、代号或技术栈..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-full px-6 py-3 pl-12 text-slate-800 dark:text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-serif" />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="mb-12 flex flex-wrap justify-center items-center gap-2">
        {categoryTabs.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveCategory(key)}
            className={`px-5 py-2 rounded-full text-xs font-black transition-all border ${activeCategory === key
              ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
              : 'bg-white/40 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-white/40 dark:border-white/10 hover:text-indigo-500'}`}
          >
            {label} <span className="opacity-60">{count}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCategoryModalOpen(true)}
          className="px-4 py-2 rounded-full text-xs font-black border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:text-indigo-500 hover:border-indigo-400 transition-all flex items-center gap-1.5"
        >
          <FolderCog size={14} /> 管理分类
        </button>
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">

        {/* 新建项目虚线矩阵 */}
        <motion.div layout onClick={() => { setIconPickerOpen(false); setCategoryPickerOpen(false); setProjectModal({ isOpen: true, mode: 'add', data: { icon: DEFAULT_PROJECT_ICON, category: knownCategoryIds.has(activeCategory) ? activeCategory : (categories[0]?.id ?? ''), tags: [] } }); }} className="group cursor-pointer flex flex-col items-center justify-center min-h-[320px] rounded-[40px] border-4 border-dashed border-slate-300 dark:border-slate-700 bg-white/10 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all duration-500">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-md group-hover:rotate-90">
              <Plus size={40} />
            </div>
            <span className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-indigo-500">INIT NEW PROJECT</span>
        </motion.div>

        <AnimatePresence mode='popLayout'>
          {filteredProjects.map((project) => (
            <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={project.id} className="h-full relative group">

              {/* 悬浮管理按钮 */}
              <div className="absolute top-8 right-8 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                  <button onClick={(e) => { e.preventDefault(); setIconPickerOpen(false); setCategoryPickerOpen(false); setProjectModal({ isOpen: true, mode: 'edit', data: project }); }} className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Edit3 size={16}/></button>
                  <button onClick={(e) => { e.preventDefault(); setDeleteModal({ isOpen: true, id: project.id, name: project.name }); }} className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Trash2 size={16}/></button>
              </div>

              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="block h-full rounded-[40px] bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-all duration-700 hover:-translate-y-1 p-8 md:p-10 relative group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>

                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-5 min-w-0">
                    <ProjectIcon name={project.icon} size={44} className="text-indigo-500 shrink-0 group-hover:scale-110 transition-transform duration-500" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">
                        {findCategoryName(categories, project.category)}
                      </span>
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{project.name}</h2>
                    </div>
                  </div>
                  <LinkIcon url={project.githubUrl} />
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 font-serif leading-relaxed line-clamp-3 mb-10 relative z-10 min-h-[60px]">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 relative z-10">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-black tracking-widest uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/10 shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredProjects.length === 0 && searchQuery && (
        <div className="text-center py-20 text-slate-500 font-serif italic">
          代号为 [{searchQuery}] 的档案似乎在云端消失了...
        </div>
      )}
    </div>
  );
}