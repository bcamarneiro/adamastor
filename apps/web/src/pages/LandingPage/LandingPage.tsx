import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import KeyMetrics from '@/components/KeyMetrics';
import MainNav from '@/components/MainNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@radix-ui/themes';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Flag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);

    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <MainNav scrollY={scrollY} />

      <AnimatePresence>
        {isLoaded && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex flex-col overflow-x-hidden"
          >
            <Hero />

            <motion.section
              variants={fadeInUp}
              custom={1}
              className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 md:py-24"
            >
              <motion.div className="max-w-2xl mx-auto text-center mb-16 md:mb-24">
                <motion.span
                  variants={fadeInUp}
                  custom={2}
                  className="inline-block text-sm tracking-wide uppercase bg-neutral-100 px-3 py-1 rounded-full mb-3 font-medium text-neutral-600"
                >
                  Parliamentary Transparency
                </motion.span>

                <motion.h2
                  variants={fadeInUp}
                  custom={3}
                  className="text-3xl md:text-4xl font-light mb-4 tracking-tight"
                >
                  Making Parliamentary Data Accessible
                </motion.h2>

                <motion.p
                  variants={fadeInUp}
                  custom={4}
                  className="text-neutral-600 md:text-lg leading-relaxed"
                >
                  Our platform bridges the gap between parliamentary activities
                  and citizen understanding by transforming complex legislative
                  data into an accessible, easy-to-understand format for
                  everyone.
                </motion.p>
              </motion.div>

              <KeyMetrics />

              <motion.div
                variants={fadeInUp}
                custom={8}
                className="mt-20 md:mt-32"
              >
                <Tabs defaultValue="sectors" className="w-full">
                  <div className="flex justify-center mb-8">
                    <TabsList className="h-12">
                      <TabsTrigger
                        value="sectors"
                        className="text-sm md:text-base px-6"
                      >
                        Key Features
                      </TabsTrigger>
                      <TabsTrigger
                        value="timeline"
                        className="text-sm md:text-base px-6"
                      >
                        Timeline
                      </TabsTrigger>
                      <TabsTrigger
                        value="promises"
                        className="text-sm md:text-base px-6"
                      >
                        Initiatives
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent
                    value="timeline"
                    className="focus-visible:outline-none"
                  >
                    <div className="text-center py-10 px-4">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                        <BarChart3 className="w-8 h-8 text-neutral-500" />
                      </div>
                      <h3 className="text-xl font-medium mb-2">
                        Legislative Timeline
                      </h3>
                      <p className="text-neutral-600 max-w-md mx-auto">
                        Track the progress of parliamentary initiatives through
                        different phases and view complete legislative
                        timelines.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="promises"
                    className="focus-visible:outline-none"
                  >
                    <div className="text-center py-10 px-4">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                        <Flag className="w-8 h-8 text-neutral-500" />
                      </div>
                      <h3 className="text-xl font-medium mb-2">
                        Parliamentary Initiatives
                      </h3>
                      <p className="text-neutral-600 max-w-md mx-auto">
                        Search, filter, and track parliamentary initiatives,
                        including voting records, debate transcripts, and
                        related documents.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </motion.section>

            <motion.section
              variants={fadeInUp}
              custom={9}
              className="bg-neutral-50 py-16 md:py-24 w-full"
            >
              <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                <div className="max-w-xl mx-auto text-center">
                  <span className="inline-block text-sm tracking-wide uppercase bg-white px-3 py-1 rounded-full mb-3 font-medium text-neutral-600">
                    Project Goals
                  </span>
                  <h2 className="text-3xl md:text-4xl font-light mb-6 tracking-tight">
                    Enhance Civic Participation
                  </h2>
                  <p className="text-neutral-600 mb-8">
                    Join our mission to democratize access to parliamentary
                    data, enhance civic participation, and ensure data
                    transparency in Portuguese governance.
                  </p>
                  <Link to="/about">
                    <Button className="rounded-full h-12 px-8 bg-neutral-900 hover:bg-neutral-800 transition-all duration-300">
                      Learn About Our Methodology
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.section>

            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
