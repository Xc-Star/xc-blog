// 项目数据由控制台写入共享内容卷 data/projects.json，此处仅做实时代理转发。
import defaults from './defaults/projects.json';
import categoryDefaults from './defaults/projectCategories.json';
import { getRuntime, liveArray } from '../lib/runtimeStore';

export type ProjectCategory = {
  id: string;
  name: string;
};

export const UNCATEGORIZED_LABEL = '未分类';

export type Project = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  githubUrl: string;
  tags: string[];
};

export const projectsData: Project[] = liveArray<Project>(
  () => (getRuntime().projects as Project[] | undefined) ?? (defaults as Project[]),
);

export const projectCategories: ProjectCategory[] = liveArray<ProjectCategory>(
  () => (getRuntime().projectCategories as ProjectCategory[] | undefined) ?? (categoryDefaults as ProjectCategory[]),
);

/** 分类被删除后旧项目会持有无效 id，统一归为未分类。 */
export function findCategoryName(categories: ProjectCategory[], id?: string | null): string {
  return categories.find(c => c.id === id)?.name ?? UNCATEGORIZED_LABEL;
}
