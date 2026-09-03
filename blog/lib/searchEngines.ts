export type SuggestProvider = 'baidu' | 'google' | 'none';

export type SearchEngine = {
  id: string;
  name: string;
  /** 查询词会被 encodeURIComponent 后拼到这个前缀后面 */
  url: string;
  /** 搜索框占位提示 */
  placeholder: string;
  /** 主题色，用于选中态与光晕 */
  accent: string;
  /** 联想词来源 */
  suggest: SuggestProvider;
};

export const searchEngines: SearchEngine[] = [
  {
    id: 'bing',
    name: '必应',
    url: 'https://www.bing.com/search?q=',
    placeholder: '用必应搜索点什么…',
    accent: '#0d7ff2',
    suggest: 'baidu',
  },
  {
    id: 'baidu',
    name: '百度',
    url: 'https://www.baidu.com/s?wd=',
    placeholder: '百度一下，你就知道',
    accent: '#2932e1',
    suggest: 'baidu',
  },
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    placeholder: 'Search with Google…',
    accent: '#ea4335',
    suggest: 'google',
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com/search?q=',
    placeholder: '搜索仓库、代码与开发者…',
    accent: '#6e40c9',
    suggest: 'none',
  },
  {
    id: 'zhihu',
    name: '知乎',
    url: 'https://www.zhihu.com/search?type=content&q=',
    placeholder: '有问题，就会有答案',
    accent: '#0084ff',
    suggest: 'baidu',
  },
  {
    id: 'bilibili',
    name: '哔哩哔哩',
    url: 'https://search.bilibili.com/all?keyword=',
    placeholder: '干杯～搜点视频看看',
    accent: '#fb7299',
    suggest: 'baidu',
  },
  {
    id: 'wikipedia',
    name: '维基百科',
    url: 'https://zh.wikipedia.org/w/index.php?search=',
    placeholder: '查点靠谱的资料…',
    accent: '#54595d',
    suggest: 'none',
  },
];

export const defaultEngineId = 'bing';

export function findEngine(id: string | null | undefined): SearchEngine {
  return searchEngines.find((engine) => engine.id === id) ?? searchEngines[0];
}

/** 输入内容看起来像网址时，直接跳转而不是走搜索引擎 */
export function asDirectUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value || /\s/.test(value)) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^localhost(:\d+)?(\/.*)?$/i.test(value)) return `http://${value}`;
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(value) && !value.endsWith('.')) {
    return `https://${value}`;
  }
  return null;
}

export function buildSearchUrl(engine: SearchEngine, query: string): string {
  return `${engine.url}${encodeURIComponent(query)}`;
}
