"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ChevronDown, X, ExternalLink } from 'lucide-react';

import {
  asDirectUrl,
  buildSearchUrl,
  defaultEngineId,
  findEngine,
  searchEngines,
} from '../../lib/searchEngines';

const ENGINE_STORAGE_KEY = 'xh-start-engine';
const NEWTAB_STORAGE_KEY = 'xh-start-newtab';

export default function SearchLauncher() {
  const [engineId, setEngineId] = useState(defaultEngineId);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [enginePickerOpen, setEnginePickerOpen] = useState(false);
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [focused, setFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const engine = useMemo(() => findEngine(engineId), [engineId]);

  // 恢复上次选择的引擎与打开方式
  useEffect(() => {
    try {
      const savedEngine = localStorage.getItem(ENGINE_STORAGE_KEY);
      if (savedEngine && searchEngines.some((item) => item.id === savedEngine)) {
        setEngineId(savedEngine);
      }
      const savedNewTab = localStorage.getItem(NEWTAB_STORAGE_KEY);
      if (savedNewTab !== null) setOpenInNewTab(savedNewTab === '1');
    } catch {
      // 隐私模式下 localStorage 可能不可用，忽略即可
    }
  }, []);

  const selectEngine = useCallback((id: string) => {
    setEngineId(id);
    setEnginePickerOpen(false);
    try {
      localStorage.setItem(ENGINE_STORAGE_KEY, id);
    } catch {
      // 忽略
    }
    inputRef.current?.focus();
  }, []);

  const toggleNewTab = useCallback(() => {
    setOpenInNewTab((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(NEWTAB_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // 忽略
      }
      return next;
    });
  }, []);

  // 联想词：防抖 + 请求竞态保护
  useEffect(() => {
    const keyword = query.trim();
    if (!keyword || engine.suggest === 'none') {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/suggest?provider=${engine.suggest}&q=${encodeURIComponent(keyword)}`, {
        signal: controller.signal,
        cache: 'no-store',
      })
        .then((res) => (res.ok ? res.json() : { suggestions: [] }))
        .then((data) => {
          setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
          setActiveIndex(-1);
        })
        .catch(() => undefined);
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, engine.suggest]);

  const runSearch = useCallback(
    (raw: string) => {
      const keyword = raw.trim();
      if (!keyword) return;
      const target = asDirectUrl(keyword) ?? buildSearchUrl(engine, keyword);
      if (openInNewTab) {
        window.open(target, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = target;
      }
      setSuggestions([]);
      setActiveIndex(-1);
    },
    [engine, openInNewTab],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const index = searchEngines.findIndex((item) => item.id === engine.id);
      const next = searchEngines[(index + (event.shiftKey ? -1 + searchEngines.length : 1)) % searchEngines.length];
      selectEngine(next.id);
      return;
    }

    if (event.key === 'ArrowDown' && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp' && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      runSearch(activeIndex >= 0 ? suggestions[activeIndex] : query);
      return;
    }

    if (event.key === 'Escape') {
      if (suggestions.length > 0) {
        setSuggestions([]);
        setActiveIndex(-1);
      } else {
        setQuery('');
        inputRef.current?.blur();
      }
    }
  };

  // 全局快捷键：/ 或 Ctrl/Cmd + K 聚焦搜索框
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typingElsewhere =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((event.key === 'k' || event.key === 'K') && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (event.key === '/' && !typingElsewhere) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // 点击外部关闭引擎面板与联想列表
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setEnginePickerOpen(false);
        setSuggestions([]);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.12, ease: 'easeOut' }}
      className="w-full max-w-2xl relative"
    >
      {/* 搜索主体 */}
      <div
        className="relative flex items-center gap-1 sm:gap-2 rounded-full bg-white/45 dark:bg-slate-800/55 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_10px_40px_rgba(15,23,42,0.18)] transition-all duration-300 pl-2 pr-2 py-2"
        style={focused ? { boxShadow: `0 12px 45px ${engine.accent}44`, borderColor: `${engine.accent}66` } : undefined}
      >
        {/* 引擎切换 */}
        <button
          type="button"
          onClick={() => setEnginePickerOpen((prev) => !prev)}
          className="flex items-center gap-1 shrink-0 h-10 pl-4 pr-2 rounded-full font-bold text-sm text-white transition-all duration-300 hover:brightness-110 active:scale-95"
          style={{ backgroundColor: engine.accent }}
          aria-haspopup="listbox"
          aria-expanded={enginePickerOpen}
          aria-label="切换搜索引擎"
        >
          {engine.name}
          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${enginePickerOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={engine.placeholder}
          spellCheck={false}
          autoComplete="off"
          className="flex-1 min-w-0 bg-transparent outline-none text-base sm:text-lg text-slate-800 dark:text-white placeholder:text-slate-500/70 dark:placeholder:text-slate-400/70 px-2"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors"
            aria-label="清空"
          >
            <X size={16} />
          </button>
        )}

        <button
          type="button"
          onClick={() => runSearch(query)}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-white transition-all duration-300 hover:brightness-110 active:scale-95 disabled:opacity-40"
          style={{ backgroundColor: engine.accent }}
          disabled={!query.trim()}
          aria-label="搜索"
        >
          <Search size={18} />
        </button>
      </div>

      {/* 引擎选择面板 */}
      <AnimatePresence>
        {enginePickerOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute z-30 mt-2 w-full rounded-3xl bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl p-3"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {searchEngines.map((item) => {
                const active = item.id === engine.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectEngine(item.id)}
                    className={`px-3 py-2 rounded-2xl text-sm font-bold transition-all duration-200 border ${
                      active
                        ? 'text-white border-transparent shadow-md scale-[1.02]'
                        : 'text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-slate-700/50 border-white/50 dark:border-white/10 hover:scale-[1.03]'
                    }`}
                    style={active ? { backgroundColor: item.accent } : undefined}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-white/40 dark:border-white/10 flex items-center justify-between px-1">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                按 <kbd className="px-1.5 py-0.5 rounded bg-white/70 dark:bg-slate-700 font-mono text-[10px]">Tab</kbd> 快速换引擎
              </span>
              <button
                type="button"
                onClick={toggleNewTab}
                className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
                  openInNewTab
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'
                }`}
              >
                <ExternalLink size={12} />
                新标签页打开
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 联想词 */}
      <AnimatePresence>
        {!enginePickerOpen && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute z-20 mt-2 w-full rounded-3xl bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl overflow-hidden py-2"
            role="listbox"
          >
            {suggestions.map((item, index) => (
              <li key={`${item}-${index}`}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => runSearch(item)}
                  className={`w-full text-left px-5 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                    index === activeIndex
                      ? 'bg-white/80 dark:bg-slate-700/70 text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Search size={14} className="opacity-50 shrink-0" />
                  <span className="truncate">{item}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
