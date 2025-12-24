import PageLayout from '@/components/ui/Layout/PageLayout';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './AboutPage.css';
import aboutPtMd from './about-pt.md';

const AboutPage: React.FC = () => {
  return (
    <PageLayout title="About" path="/about">
      <div className="max-w-2xl m-5">
        <Markdown remarkPlugins={[remarkGfm]}>{aboutPtMd}</Markdown>
      </div>
    </PageLayout>
  );
};

export default AboutPage;
