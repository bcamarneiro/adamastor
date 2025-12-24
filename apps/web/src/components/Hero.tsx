import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative h-[90vh] flex items-center justify-center bg-neutral-50">
      <div className="absolute inset-0">
        <img
          src="/public/images/hero-bg.webp"
          alt="Portuguese Parliament"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/60" />
      </div>
      <div className="container px-6 md:px-8 z-10">
        <div className=" max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-medium mb-6 tracking-tight text-neutral-900">
            Tracking Parliamentary Performance
          </h1>

          <p className="text-lg md:text-xl text-neutral-800 mb-8 leading-relaxed font-medium">
            A comprehensive platform for monitoring and analyzing parliamentary
            activities, making governance data accessible to everyone.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              to="/initiatives"
              className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-900 px-8 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
            >
              View Initiatives
            </Link>
            <Link
              to="/parliament"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-neutral-900 border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              Explore Parliament
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
