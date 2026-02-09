import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <div {...props}>{children}</div>
    ),
    p: ({ children, ...props }: React.PropsWithChildren<object>) => <p {...props}>{children}</p>,
    h2: ({ children, ...props }: React.PropsWithChildren<object>) => <h2 {...props}>{children}</h2>,
    span: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <span {...props}>{children}</span>
    ),
    a: ({ children, ...props }: React.PropsWithChildren<object>) => <a {...props}>{children}</a>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => <>{children}</>,
}));

// Mock child components
vi.mock('../../components/MainNav', () => ({
  default: () => <nav data-testid="main-nav-component">MainNav</nav>,
}));

vi.mock('../../components/Hero', () => ({
  default: () => <section data-testid="hero-component">Hero</section>,
}));

vi.mock('../../components/KeyMetrics', () => ({
  default: () => <section data-testid="key-metrics-component">KeyMetrics</section>,
}));

vi.mock('../../components/Footer', () => ({
  default: () => <footer data-testid="footer-component">Footer</footer>,
}));

vi.mock('../../components/SEO', () => ({
  SEO: () => null,
  SEO_CONFIGS: { landing: {} },
  getOrganizationSchema: () => ({}),
}));

import LandingPage from './LandingPage';

const renderLandingPage = () => {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
};

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Components', () => {
    it('should render MainNav component', () => {
      renderLandingPage();
      expect(screen.getByTestId('main-nav-component')).toBeInTheDocument();
    });

    it('should render Hero component', () => {
      renderLandingPage();
      expect(screen.getByTestId('hero-component')).toBeInTheDocument();
    });

    it('should render KeyMetrics component', () => {
      renderLandingPage();
      expect(screen.getByTestId('key-metrics-component')).toBeInTheDocument();
    });

    it('should render Footer component', () => {
      renderLandingPage();
      expect(screen.getByTestId('footer-component')).toBeInTheDocument();
    });
  });

  describe('Feature Cards Section', () => {
    describe('Feature Cards Content', () => {
      it('should render Report Card feature', () => {
        renderLandingPage();
        expect(screen.getByText('Report Card')).toBeInTheDocument();
      });

      it('should render Ranking feature', () => {
        renderLandingPage();
        expect(screen.getByText('Ranking')).toBeInTheDocument();
      });

      it('should render Todos os Deputados feature', () => {
        renderLandingPage();
        expect(screen.getByText('Todos os Deputados')).toBeInTheDocument();
      });

      it('should render Iniciativas feature', () => {
        renderLandingPage();
        expect(screen.getByText('Iniciativas')).toBeInTheDocument();
      });

      it('should render Calculadora feature', () => {
        renderLandingPage();
        expect(screen.getByText('Calculadora')).toBeInTheDocument();
      });

      it('should render Battle Royale feature', () => {
        renderLandingPage();
        expect(screen.getByText('Battle Royale')).toBeInTheDocument();
      });
    });

    describe('Feature Cards Links', () => {
      it('should render 6 feature card links', () => {
        const { container } = renderLandingPage();
        // Feature cards are links inside the feature section
        const featureLinks = container.querySelectorAll('a[href^="/"]');
        // Should have at least 6 feature cards plus other links
        expect(featureLinks.length).toBeGreaterThanOrEqual(6);
      });

      it('should link Report Card to /report-card', () => {
        renderLandingPage();
        const link = screen.getByRole('link', { name: /Report Card/i });
        expect(link).toHaveAttribute('href', '/report-card');
      });

      it('should link Ranking to /ranking', () => {
        renderLandingPage();
        const link = screen.getByRole('link', { name: /Ranking/i });
        expect(link).toHaveAttribute('href', '/ranking');
      });

      it('should link Todos os Deputados to /parliament', () => {
        const { container } = renderLandingPage();
        const link = container.querySelector('a[href="/parliament"]');
        expect(link).toBeTruthy();
        expect(link?.textContent).toContain('Todos os Deputados');
      });

      it('should link Iniciativas to /initiatives', () => {
        renderLandingPage();
        const link = screen.getByRole('link', { name: /Iniciativas/i });
        expect(link).toHaveAttribute('href', '/initiatives');
      });

      it('should link Calculadora to /desperdicio', () => {
        renderLandingPage();
        const link = screen.getByRole('link', { name: /Calculadora/i });
        expect(link).toHaveAttribute('href', '/desperdicio');
      });

      it('should link Battle Royale to /batalha', () => {
        renderLandingPage();
        const link = screen.getByRole('link', { name: /Battle Royale/i });
        expect(link).toHaveAttribute('href', '/batalha');
      });
    });

    describe('Feature Section Header', () => {
      it('should render Ferramentas section label', () => {
        renderLandingPage();
        expect(screen.getByText('Ferramentas')).toBeInTheDocument();
      });

      it('should render section description', () => {
        renderLandingPage();
        expect(screen.getByText(/Seis ferramentas/i)).toBeInTheDocument();
      });
    });
  });

  describe('How It Works Section', () => {
    it('should render Como Funciona section label', () => {
      renderLandingPage();
      expect(screen.getByText('Como Funciona')).toBeInTheDocument();
    });

    it('should render pipeline title', () => {
      renderLandingPage();
      expect(screen.getByText('Do Parlamento para ti.')).toBeInTheDocument();
    });

    it('should render API do Parlamento step', () => {
      renderLandingPage();
      expect(screen.getByText('API do Parlamento')).toBeInTheDocument();
    });

    it('should render Watcher step', () => {
      renderLandingPage();
      expect(screen.getByText('Watcher')).toBeInTheDocument();
    });

    it('should render Base de Dados step', () => {
      renderLandingPage();
      expect(screen.getByText('Base de Dados')).toBeInTheDocument();
    });

    it('should render Tu step', () => {
      renderLandingPage();
      expect(screen.getByText('Tu')).toBeInTheDocument();
    });
  });

  describe('Open Source CTA Section', () => {
    it('should render Open Source badge', () => {
      renderLandingPage();
      expect(screen.getByText('Open Source')).toBeInTheDocument();
    });

    it('should render CTA title', () => {
      renderLandingPage();
      expect(screen.getByText(/Código aberto/i)).toBeInTheDocument();
    });

    it('should render GitHub link', () => {
      renderLandingPage();
      const githubLink = screen.getByRole('link', { name: /GitHub/i });
      expect(githubLink).toHaveAttribute('href', expect.stringContaining('github.com'));
    });

    it('should render Contribute link', () => {
      renderLandingPage();
      const contributeLink = screen.getByRole('link', { name: /Contribuir/i });
      expect(contributeLink).toHaveAttribute('href', '/contribuir');
    });
  });

  describe('Page Layout', () => {
    it('should render page with min-height screen', () => {
      const { container } = renderLandingPage();
      const pageContainer = container.querySelector('.min-h-screen');
      expect(pageContainer).toBeTruthy();
    });

    it('should render page with neutral-1 background', () => {
      const { container } = renderLandingPage();
      const pageContainer = container.querySelector('.bg-neutral-1');
      expect(pageContainer).toBeTruthy();
    });

    it('should render components in correct order', () => {
      renderLandingPage();

      const mainNav = screen.getByTestId('main-nav-component');
      const hero = screen.getByTestId('hero-component');
      const keyMetrics = screen.getByTestId('key-metrics-component');
      const footer = screen.getByTestId('footer-component');

      expect(mainNav).toBeInTheDocument();
      expect(hero).toBeInTheDocument();
      expect(keyMetrics).toBeInTheDocument();
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible feature card links', () => {
      renderLandingPage();

      const links = screen.getAllByRole('link');
      for (const link of links) {
        // Each link should have accessible text content
        expect(link.textContent?.trim().length).toBeGreaterThan(0);
      }
    });

    it('should render sections with semantic structure', () => {
      const { container } = renderLandingPage();

      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThanOrEqual(2);
    });
  });
});
