import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import ChatterBoard from './ChatterBoard';
import { siteConfig } from '@/siteConfig';
import { getDocuments } from '../../lib/content.server';


export async function generateMetadata() {
  return {
    title: "杂谈 | " + siteConfig.title,
    description: "日常碎片与灵感记录",
  };
}

export default async function ChatterPage() {
  let chatters: {
    slug: string;
    title: string;
    date: string;
    tags: string[];
    mood: string;
    cover: string;
    content: string;
  }[] = [];

  try {
    const chatterDocs = await getDocuments('chatter');
    chatters = chatterDocs.map(({ slug, data, content }) => {
      return {
        slug,
        title: data.title || '',
        date: data.date || '未知时间',
        tags: data.tags || [],
        mood: data.mood || '',
        cover: data.cover || '',
        content: content.replace(/^#+ .*\n/m, '') // 去除开头的 markdown 标题以优化截取显示
      };
    });
  } catch (e) {
    console.error("读取杂谈文件失败:", e);
  }

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        {/* 将解析好的数据传递给客户端组件进行瀑布流渲染 */}
        <ChatterBoard chatters={chatters} />
      </PageTransition>
    </div>
  );
}