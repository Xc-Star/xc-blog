// 友链数据由控制台写入共享内容卷 data/friends.json，此处仅做实时代理转发。
import defaults from './defaults/friends.json';
import { getRuntime, liveArray } from '../lib/runtimeStore';

export interface Friend { id: string; name: string; url: string; description: string; avatar: string; themeColor: string; }

export const friendsData: Friend[] = liveArray<Friend>(
  () => (getRuntime().friends as Friend[] | undefined) ?? (defaults as Friend[]),
);
