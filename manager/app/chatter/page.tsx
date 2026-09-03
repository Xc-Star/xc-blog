import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import ChatterBoard from './ChatterBoard';
import { siteConfig } from '../../siteConfig';
import { getDocuments, loadRuntime } from '../../lib/content.server';

export async function generateMetadata() {
  loadRuntime();
  return {
    title: "杂谈 | " + siteConfig.title,
    description: "日常碎片与灵感记录",
  };
}

export default async function ChatterPage() {
  const chatters = (await getDocuments('chatter')).map(({ slug, data, content }) => ({
    slug,
    title: data.title || '',
    date: data.date || '1970-01-01', // 👇 核心修复：加上日期兜底防崩溃
    tags: data.tags || [],
    mood: data.mood || '',
    cover: data.cover || '',
    content: content.replace(/^#+ .*\n/m, '')
  }));

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <ChatterBoard chatters={chatters} />
      </PageTransition>
    </div>
  );
}