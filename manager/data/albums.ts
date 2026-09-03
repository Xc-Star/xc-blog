// 🛡️ 相册数据由控制台写入共享内容卷 data/albums.json，此处仅做实时代理转发。
import defaults from './defaults/albums.json';
import { getRuntime, liveArray } from '../lib/runtimeStore';

export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = liveArray<Album>(
  () => (getRuntime().albums as Album[] | undefined) ?? (defaults as Album[]),
);
