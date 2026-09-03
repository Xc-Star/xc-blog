import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { siteConfig } from '../../siteConfig';
import TimelineClient from '../../components/TimelineClient';
import { getDocuments } from '../../lib/content.server';

export default async function Timeline() {
  let posts: any[] = [];
  let tagCounts: Record<string, number> = {};

  try {
    const docs = await getDocuments('post');

    docs.forEach(({ slug, data }) => {
      const postTags = data.tags && Array.isArray(data.tags) ? data.tags : ['未分类'];

      postTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });

      posts.push({
        slug,
        title: data.title || '无标题',
        date: data.date || '1970-01-01',
        description: data.description || '',
        tags: postTags,
        cover: data.cover || siteConfig.defaultPostCover,
        // 删除了坑人的 mtime
      });
    });
  } catch(e) {
    console.error("读取文章列表失败", e);
  }

  const tagsArray = Object.keys(tagCounts)
    .map(name => ({ name, count: tagCounts[name] }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen relative pb-32">
      <Navbar />
      <PageTransition>
        <TimelineClient posts={posts} tags={tagsArray} />
      </PageTransition>
    </div>
  );
}