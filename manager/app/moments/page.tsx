import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import MomentList from './MomentList';
import { siteConfig } from '../../siteConfig';
import { getMoments, loadRuntime } from '../../lib/content.server';

export async function generateMetadata() {
  loadRuntime();
  return {
    title: "说说 | " + siteConfig.title,
    description: "生活动态与瞬间记录",
  };
}

export default async function MomentsPage() {
  const allMoments = await getMoments();

  return (
    <div className="min-h-screen relative pb-10 flex flex-col">
      <Navbar />
      <PageTransition>
        <div className="flex-1 flex flex-col">
          <MomentList
            moments={allMoments}
            authorName={siteConfig.authorName}
            avatarUrl={siteConfig.avatarUrl}
          />
        </div>
      </PageTransition>
    </div>
  );
}