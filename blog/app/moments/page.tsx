import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import MomentList from './MomentList';
import { siteConfig } from '../../siteConfig';
import { getMoments } from '../../lib/content.server';

export async function generateMetadata() {
  return {
    title: "说说 | " + siteConfig.title,
    description: "生活动态与瞬间记录",
  };
}

export default async function MomentsPage() {
  let allMoments: any[] = [];

  try {
    allMoments = await getMoments();
  } catch (e) {
    console.error("读取说说数据失败:", e);
  }

  return (
    <div className="min-h-screen relative pb-10 flex flex-col">
      <Navbar />
      <PageTransition>
        <MomentList
          moments={allMoments}
          authorName={siteConfig.authorName}
          avatarUrl={siteConfig.avatarUrl}
        />
      </PageTransition>
    </div>
  );
}