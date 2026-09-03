import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import StartPage from '../components/startpage/StartPage';
import { siteConfig } from '../siteConfig';

export async function generateMetadata() {
  return {
    title: siteConfig.title,
    description: '一个干净的起始页：时间、一言与多引擎搜索。',
  };
}

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <Navbar />
      <PageTransition>
        <StartPage />
      </PageTransition>
    </div>
  );
}
