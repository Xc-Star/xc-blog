import { getDocuments, getMoments, type DocumentEntry } from '../../lib/content.server';

// 引入前台客户端组件
import CreativeWorkshopClient from './CreativeWorkshopClient';

function mapDocuments(entries: DocumentEntry[], typeName: string) {
  return entries.map(({ slug, data, content }: any) => ({
    id: data.id || slug,
    slug: slug, // 🌟 强制保留真实的 slug 供路由跳转使用
    title: data.title || '',
    type: typeName,
    date: data.date || '2026-05-01',
    // 🌟 核心修复：把 cover（封面图）提取出来传给前台！如果写的是 image 也兼容
    cover: data.cover || data.image || null,
    // 把正文传给前台，去掉可能存在的换行符，限制长度防止卡片撑爆
    content: content.trim()
  }));
}

export default async function CreativeWorkshopPage() {
  const [postDocs, chatterDocs, momentDocs] = await Promise.all([
    getDocuments('post'),
    getDocuments('chatter'),
    getMoments(),
  ]);
  const posts = mapDocuments(postDocs, 'post');
  const chatters = mapDocuments(chatterDocs, 'chatter');
  const moments = momentDocs.map(moment => ({
    id: moment.id,
    slug: moment.id,
    title: moment.content.slice(0, 24) || '说说',
    type: 'moment',
    date: moment.date || '2026-05-01',
    cover: moment.images[0] || null,
    content: moment.content.trim()
  }));

  return (
    <CreativeWorkshopClient
      posts={posts}
      chatters={chatters}
      moments={moments}
    />
  );
}