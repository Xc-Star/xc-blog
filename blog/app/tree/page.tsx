// 引入前台客户端组件
import CreativeWorkshopClient from './CreativeWorkshopClient';
import { getDocuments, getMoments } from '../../lib/content.server';

export default async function CreativeWorkshopPage() {
  const [postDocs, chatterDocs, momentDocs] = await Promise.all([
    getDocuments('post'),
    getDocuments('chatter'),
    getMoments(),
  ]);

  const posts = postDocs.map(({ slug, data, content }) => ({
    id: slug,
    slug, // 强制保留真实的 slug 供路由跳转使用
    title: data.title || '',
    type: 'post',
    date: data.date || '2026-05-01',
    // 核心修复：把 cover（封面图）提取出来传给前台！
    cover: data.cover || null,
    // 把正文传给前台，去掉可能存在的换行符，限制长度防止卡片撑爆
    content: content.trim()
  }));
  const chatters = chatterDocs.map(({ slug, data, content }) => ({
    id: slug,
    slug, // 强制保留真实的 slug 供路由跳转使用
    title: data.title || '',
    type: 'chatter',
    date: data.date || '2026-05-01',
    // 核心修复：把 cover（封面图）提取出来传给前台！
    cover: data.cover || null,
    // 把正文传给前台，去掉可能存在的换行符，限制长度防止卡片撑爆
    content: content.trim()
  }));
  const moments = momentDocs.map(({ id, date, content }) => ({
    id,
    slug: id, // 强制保留真实的 slug 供路由跳转使用
    title: '',
    type: 'moment',
    date: date || '2026-05-01',
    // 核心修复：把 cover（封面图）提取出来传给前台！
    cover: null,
    // 把正文传给前台，去掉可能存在的换行符，限制长度防止卡片撑爆
    content: content.trim()
  }));

  return (
    <CreativeWorkshopClient
      posts={posts}
      chatters={chatters}
      moments={moments}
    />
  );
}