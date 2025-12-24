import GovPerfLogo from '@/components/ui/Icons/GovPerfLogo';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-white py-16">
      <div className="container px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <GovPerfLogo className="h-8 w-8" />
              <span className="text-lg font-medium">Gov Perf</span>
            </Link>
            <p className="mt-4 text-sm text-neutral-400">
              Making parliamentary data accessible and transparent for everyone.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/initiatives"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Initiatives
                </Link>
              </li>
              <li>
                <Link
                  to="/parliament"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Parliament
                </Link>
              </li>
              <li>
                <Link
                  to="/docs"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.parlamento.pt/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Portuguese Parliament
                </a>
              </li>
              <li>
                <a
                  href="https://www.parlamento.pt/sites/COM/XIVLeg/1CACDLG/Paginas/default.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Parliamentary Committees
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-800">
          <p className="text-sm text-neutral-400 text-center">
            © {new Date().getFullYear()} Gov Perf. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
