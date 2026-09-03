// 🛡️ 项目数据由控制台写入共享内容卷 data/projects.json，此处仅做实时代理转发。
import defaults from './defaults/projects.json';
import { getRuntime, liveArray } from '../lib/runtimeStore';

export type Project = {
  id: string;
  name: string;
  description: string;
  icon: string;
  githubUrl: string;
  tags: string[];
};

export const projectsData: Project[] = liveArray<Project>(
  () => (getRuntime().projects as Project[] | undefined) ?? (defaults as Project[]),
);