import {
  Rocket,
  Code2,
  Terminal,
  Atom,
  FlaskConical,
  Microscope,
  BrainCircuit,
  Database,
  Server,
  Cpu,
  Globe,
  Package,
  Wrench,
  Bot,
  Gamepad2,
  Palette,
  BookOpen,
  LineChart,
  ShieldCheck,
  Sparkles,
  Zap,
  Cloud,
  GitBranch,
  Layers,
  type LucideIcon,
} from 'lucide-react';

export type ProjectIconKey =
  | 'rocket' | 'code' | 'terminal' | 'atom' | 'flask' | 'microscope'
  | 'brain' | 'database' | 'server' | 'cpu' | 'globe' | 'package'
  | 'wrench' | 'bot' | 'game' | 'palette' | 'book' | 'chart'
  | 'shield' | 'sparkles' | 'zap' | 'cloud' | 'git' | 'layers';

export const PROJECT_ICON_OPTIONS: { key: ProjectIconKey; label: string; Icon: LucideIcon }[] = [
  { key: 'rocket', label: '火箭 · 发射', Icon: Rocket },
  { key: 'code', label: '代码 · 源码', Icon: Code2 },
  { key: 'terminal', label: '终端 · 命令行', Icon: Terminal },
  { key: 'atom', label: '原子 · 物理', Icon: Atom },
  { key: 'flask', label: '烧瓶 · 化学', Icon: FlaskConical },
  { key: 'microscope', label: '显微镜 · 科研', Icon: Microscope },
  { key: 'brain', label: '神经网络 · AI', Icon: BrainCircuit },
  { key: 'database', label: '数据库 · 存储', Icon: Database },
  { key: 'server', label: '服务器 · 后端', Icon: Server },
  { key: 'cpu', label: '芯片 · 算力', Icon: Cpu },
  { key: 'globe', label: '地球 · Web', Icon: Globe },
  { key: 'package', label: '包 · 依赖', Icon: Package },
  { key: 'wrench', label: '扳手 · 工具', Icon: Wrench },
  { key: 'bot', label: '机器人 · 自动化', Icon: Bot },
  { key: 'game', label: '手柄 · 游戏', Icon: Gamepad2 },
  { key: 'palette', label: '调色板 · 设计', Icon: Palette },
  { key: 'book', label: '书本 · 文档', Icon: BookOpen },
  { key: 'chart', label: '折线图 · 数据分析', Icon: LineChart },
  { key: 'shield', label: '盾牌 · 安全', Icon: ShieldCheck },
  { key: 'sparkles', label: '星芒 · 创意', Icon: Sparkles },
  { key: 'zap', label: '闪电 · 性能', Icon: Zap },
  { key: 'cloud', label: '云 · 部署', Icon: Cloud },
  { key: 'git', label: '分支 · 版本控制', Icon: GitBranch },
  { key: 'layers', label: '图层 · 架构', Icon: Layers },
];

export const DEFAULT_PROJECT_ICON: ProjectIconKey = 'rocket';

const ICON_MAP = new Map(PROJECT_ICON_OPTIONS.map(o => [o.key, o.Icon]));

// 历史数据可能存的是任意字符串（含 emoji），无法识别时回落到默认图标。
export function resolveProjectIconKey(value?: string | null): ProjectIconKey {
  const key = value?.trim();
  return key && ICON_MAP.has(key as ProjectIconKey) ? (key as ProjectIconKey) : DEFAULT_PROJECT_ICON;
}

export function getProjectIconComponent(value?: string | null): LucideIcon {
  return ICON_MAP.get(resolveProjectIconKey(value)) ?? Rocket;
}

export default function ProjectIcon({
  name,
  size = 32,
  className = '',
  strokeWidth = 1.75,
}: {
  name?: string | null;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = getProjectIconComponent(name);
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}
