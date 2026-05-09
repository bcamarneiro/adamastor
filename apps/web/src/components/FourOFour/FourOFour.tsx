import { SEO, SEO_CONFIGS } from '@/components/SEO';

const FourOFour: React.FC<{ label?: string }> = ({ label = '404' }) => (
  <>
    <SEO {...SEO_CONFIGS.notFound} noindex />
    <div className="h-full w-full flex flex-col items-center justify-center">
      <img src="/404-gandalf.gif" alt={label} />
      <p>{label}</p>
    </div>
  </>
);

export default FourOFour;
