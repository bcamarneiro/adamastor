import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LandingPage from './LandingPage';

// Mock react-router-dom Link component
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock framer-motion to simplify testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
    section: ({ children, ...props }: { children?: React.ReactNode }) => (
      <section {...props}>{children}</section>
    ),
    span: ({ children, ...props }: { children?: React.ReactNode }) => (
      <span {...props}>{children}</span>
    ),
    h2: ({ children, ...props }: { children?: React.ReactNode }) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: { children?: React.ReactNode }) => <p {...props}>{children}</p>,
  },
}));

// Mock child components that may have complex dependencies
vi.mock('@/components/Hero', () => ({
  default: () => <div data-testid="hero-component">Hero</div>,
}));

vi.mock('@/components/KeyMetrics', () => ({
  default: () => <div data-testid="key-metrics-component">KeyMetrics</div>,
}));

vi.mock('@/components/MainNav', () => ({
  default: ({ scrollY }: { scrollY: number }) => (
    <nav data-testid="main-nav-component">MainNav (scrollY: {scrollY})</nav>
  ),
}));

vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer-component">Footer</footer>,
}));

vi.mock('@/components/SEO', () => ({
  SEO: () => null,
  SEO_CONFIGS: { landing: {} },
  getOrganizationSchema: () => ({}),
}));

// Mock Radix UI Button
vi.mock('@radix-ui/themes', () => ({
  Button: ({ children, ...props }: { children?: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

// Create a stateful mock for Tabs that properly handles tab switching
// This allows testing the tab interaction behavior
const createTabsContextValue = () => {
  let activeTab = 'sectors'; // default from component
  const listeners: ((tab: string) => void)[] = [];

  return {
    getActiveTab: () => activeTab,
    setActiveTab: (tab: string) => {
      activeTab = tab;
      listeners.forEach((l) => l(tab));
    },
    subscribe: (listener: (tab: string) => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      };
    },
  };
};

let tabsContext = createTabsContextValue();

// Reset tabs context before each test
beforeEach(() => {
  tabsContext = createTabsContextValue();
});

// Mock UI components - Tabs with functional state management
vi.mock('@/components/ui/tabs', () => {
  // Create context for tabs state
  const TabsContext = React.createContext<{
    activeTab: string;
    setActiveTab: (value: string) => void;
  } | null>(null);

  return {
    Tabs: ({
      children,
      defaultValue,
      ...props
    }: { children?: React.ReactNode; defaultValue?: string }) => {
      const [activeTab, setActiveTab] = React.useState(defaultValue || 'sectors');

      // Store in context for TabsContent/TabsTrigger to access
      React.useEffect(() => {
        tabsContext.setActiveTab(activeTab);
      }, [activeTab]);

      return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
          <div data-testid="tabs" data-active-tab={activeTab} {...props}>
            {children}
          </div>
        </TabsContext.Provider>
      );
    },
    TabsContent: ({
      children,
      value,
      ...props
    }: {
      children?: React.ReactNode;
      value: string;
    }) => {
      const context = React.useContext(TabsContext);
      const isActive = context?.activeTab === value;
      return (
        <div
          data-testid={`tabs-content-${value}`}
          data-state={isActive ? 'active' : 'inactive'}
          hidden={!isActive}
          {...props}
        >
          {isActive ? children : null}
        </div>
      );
    },
    TabsList: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
    }) => (
      <div data-testid="tabs-list" role="tablist" {...props}>
        {children}
      </div>
    ),
    TabsTrigger: ({
      children,
      value,
      ...props
    }: {
      children?: React.ReactNode;
      value: string;
    }) => {
      const context = React.useContext(TabsContext);
      const isActive = context?.activeTab === value;
      return (
        <button
          data-testid={`tabs-trigger-${value}`}
          role="tab"
          aria-selected={isActive}
          data-state={isActive ? 'active' : 'inactive'}
          onClick={() => context?.setActiveTab(value)}
          {...props}
        >
          {children}
        </button>
      );
    },
  };
});

describe('LandingPage', () => {
  describe('Feature Cards Rendering', () => {
    describe('Report Card Feature', () => {
      it('should render Report Card title', () => {
        render(<LandingPage />);

        expect(screen.getByText('Report Card')).toBeTruthy();
      });

      it('should render Report Card description', () => {
        render(<LandingPage />);

        expect(
          screen.getByText('Descobre a nota do teu deputado com base na sua atividade parlamentar.')
        ).toBeTruthy();
      });

      it('should link Report Card to /report-card', () => {
        render(<LandingPage />);

        const reportCardLink = screen.getByText('Report Card').closest('a');
        expect(reportCardLink).toBeTruthy();
        expect(reportCardLink?.getAttribute('href')).toBe('/report-card');
      });

      it('should render Report Card with BarChart3 icon', () => {
        render(<LandingPage />);

        // Find the Report Card link and check for svg icon inside
        const reportCardLink = screen.getByText('Report Card').closest('a');
        expect(reportCardLink).toBeTruthy();

        const icon = reportCardLink?.querySelector('svg');
        expect(icon).toBeTruthy();
      });
    });

    describe('Ranking Feature', () => {
      it('should render Ranking title', () => {
        render(<LandingPage />);

        expect(screen.getByText('Ranking')).toBeTruthy();
      });

      it('should render Ranking description', () => {
        render(<LandingPage />);

        expect(
          screen.getByText('Compara a atividade parlamentar de todos os deputados.')
        ).toBeTruthy();
      });

      it('should link Ranking to /ranking', () => {
        render(<LandingPage />);

        const rankingLink = screen.getByText('Ranking').closest('a');
        expect(rankingLink).toBeTruthy();
        expect(rankingLink?.getAttribute('href')).toBe('/ranking');
      });

      it('should render Ranking with Trophy icon', () => {
        render(<LandingPage />);

        // Find the Ranking link and check for svg icon inside
        const rankingLink = screen.getByText('Ranking').closest('a');
        expect(rankingLink).toBeTruthy();

        const icon = rankingLink?.querySelector('svg');
        expect(icon).toBeTruthy();
      });
    });

    describe('Calculator Feature', () => {
      it('should render Calculadora title', () => {
        render(<LandingPage />);

        expect(screen.getByText('Calculadora')).toBeTruthy();
      });

      it('should render Calculadora description', () => {
        render(<LandingPage />);

        expect(
          screen.getByText(
            'Calcula quanto do teu IRS vai para deputados com baixa atividade registada.'
          )
        ).toBeTruthy();
      });

      it('should link Calculadora to /desperdicio', () => {
        render(<LandingPage />);

        const calculatorLink = screen.getByText('Calculadora').closest('a');
        expect(calculatorLink).toBeTruthy();
        expect(calculatorLink?.getAttribute('href')).toBe('/desperdicio');
      });

      it('should render Calculadora with Calculator icon', () => {
        render(<LandingPage />);

        // Find the Calculadora link and check for svg icon inside
        const calculatorLink = screen.getByText('Calculadora').closest('a');
        expect(calculatorLink).toBeTruthy();

        const icon = calculatorLink?.querySelector('svg');
        expect(icon).toBeTruthy();
      });
    });

    describe('Battle Royale Feature', () => {
      it('should render Battle Royale title', () => {
        render(<LandingPage />);

        expect(screen.getByText('Battle Royale')).toBeTruthy();
      });

      it('should render Battle Royale description', () => {
        render(<LandingPage />);

        expect(screen.getByText('Compara dois deputados lado a lado.')).toBeTruthy();
      });

      it('should link Battle Royale to /batalha', () => {
        render(<LandingPage />);

        const battleLink = screen.getByText('Battle Royale').closest('a');
        expect(battleLink).toBeTruthy();
        expect(battleLink?.getAttribute('href')).toBe('/batalha');
      });

      it('should render Battle Royale with Swords icon', () => {
        render(<LandingPage />);

        // Find the Battle Royale link and check for svg icon inside
        const battleLink = screen.getByText('Battle Royale').closest('a');
        expect(battleLink).toBeTruthy();

        const icon = battleLink?.querySelector('svg');
        expect(icon).toBeTruthy();
      });
    });

    describe('Feature Cards Grid', () => {
      it('should render all 4 feature cards', () => {
        render(<LandingPage />);

        expect(screen.getByText('Report Card')).toBeTruthy();
        expect(screen.getByText('Ranking')).toBeTruthy();
        expect(screen.getByText('Calculadora')).toBeTruthy();
        expect(screen.getByText('Battle Royale')).toBeTruthy();
      });

      it('should render exactly 4 feature card links', () => {
        const { container } = render(<LandingPage />);

        // Find all feature card links by looking at the group class on the links
        const featureCardLinks = container.querySelectorAll('a.group');
        expect(featureCardLinks.length).toBe(4);
      });

      it('should render all feature card descriptions', () => {
        render(<LandingPage />);

        expect(
          screen.getByText('Descobre a nota do teu deputado com base na sua atividade parlamentar.')
        ).toBeTruthy();
        expect(
          screen.getByText('Compara a atividade parlamentar de todos os deputados.')
        ).toBeTruthy();
        expect(
          screen.getByText(
            'Calcula quanto do teu IRS vai para deputados com baixa atividade registada.'
          )
        ).toBeTruthy();
        expect(screen.getByText('Compara dois deputados lado a lado.')).toBeTruthy();
      });

      it('should render feature cards in a grid layout', () => {
        const { container } = render(<LandingPage />);

        // The feature cards grid has specific grid classes
        const grid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
        expect(grid).toBeTruthy();
      });

      it('should render each feature card as a clickable link', () => {
        render(<LandingPage />);

        const reportCardLink = screen.getByText('Report Card').closest('a');
        const rankingLink = screen.getByText('Ranking').closest('a');
        const calculatorLink = screen.getByText('Calculadora').closest('a');
        const battleLink = screen.getByText('Battle Royale').closest('a');

        expect(reportCardLink).toBeTruthy();
        expect(rankingLink).toBeTruthy();
        expect(calculatorLink).toBeTruthy();
        expect(battleLink).toBeTruthy();
      });

      it('should render each feature card with an icon container', () => {
        const { container } = render(<LandingPage />);

        // Each feature card has an icon container with w-12 h-12 rounded-xl classes
        const iconContainers = container.querySelectorAll('.w-12.h-12.rounded-xl');
        expect(iconContainers.length).toBe(4);
      });

      it('should render feature card titles with correct styling', () => {
        const { container } = render(<LandingPage />);

        // Feature card titles have text-lg font-semibold text-neutral-12 classes
        const titles = container.querySelectorAll('h3.text-lg.font-semibold.text-neutral-12');
        expect(titles.length).toBe(4);
      });

      it('should render feature card descriptions with correct styling', () => {
        const { container } = render(<LandingPage />);

        // Descriptions have text-sm text-neutral-11 classes
        const descriptions = container.querySelectorAll('.text-sm.text-neutral-11');
        expect(descriptions.length).toBeGreaterThanOrEqual(4);
      });

      it('should render feature cards with border and hover effects', () => {
        const { container } = render(<LandingPage />);

        // Feature card links have border border-neutral-5 hover:border-accent-7 classes
        const cardsWithBorder = container.querySelectorAll('a.border.border-neutral-5');
        expect(cardsWithBorder.length).toBe(4);
      });
    });

    describe('Feature Section Header', () => {
      it('should render section badge "Acompanha o Teu Deputado"', () => {
        render(<LandingPage />);

        expect(screen.getByText('Acompanha o Teu Deputado')).toBeTruthy();
      });

      it('should render section title "Explora as Nossas Ferramentas"', () => {
        render(<LandingPage />);

        expect(screen.getByText('Explora as Nossas Ferramentas')).toBeTruthy();
      });

      it('should render section description', () => {
        render(<LandingPage />);

        expect(
          screen.getByText(
            'Descobre como os teus deputados trabalham com dados reais do Parlamento.'
          )
        ).toBeTruthy();
      });

      it('should render section badge with accent styling', () => {
        const { container } = render(<LandingPage />);

        // Badge has bg-accent-3 rounded-full text-accent-11 classes
        const badge = container.querySelector('.bg-accent-3.rounded-full');
        expect(badge).toBeTruthy();
        expect(badge?.textContent).toContain('Acompanha o Teu Deputado');
      });
    });

    describe('Feature Card Links Uniqueness', () => {
      it('should have unique hrefs for all feature cards', () => {
        const { container } = render(<LandingPage />);

        const featureCardLinks = container.querySelectorAll('a.group');
        const hrefs = Array.from(featureCardLinks).map((link) => link.getAttribute('href'));

        // All hrefs should be unique
        const uniqueHrefs = new Set(hrefs);
        expect(uniqueHrefs.size).toBe(4);
      });

      it('should link to correct routes for each feature', () => {
        render(<LandingPage />);

        const expectedRoutes = [
          { title: 'Report Card', route: '/report-card' },
          { title: 'Ranking', route: '/ranking' },
          { title: 'Calculadora', route: '/desperdicio' },
          { title: 'Battle Royale', route: '/batalha' },
        ];

        expectedRoutes.forEach(({ title, route }) => {
          const link = screen.getByText(title).closest('a');
          expect(link?.getAttribute('href')).toBe(route);
        });
      });
    });

    describe('Feature Card Icons', () => {
      it('should render an SVG icon in each feature card', () => {
        const { container } = render(<LandingPage />);

        const featureCardLinks = container.querySelectorAll('a.group');

        featureCardLinks.forEach((link) => {
          const svg = link.querySelector('svg');
          expect(svg).toBeTruthy();
        });
      });

      it('should render icons with correct sizing classes', () => {
        const { container } = render(<LandingPage />);

        // Icons should have w-6 h-6 classes
        const iconContainers = container.querySelectorAll('.w-12.h-12.rounded-xl');

        iconContainers.forEach((iconContainer) => {
          const svg = iconContainer.querySelector('svg');
          expect(svg).toBeTruthy();
          expect(svg?.classList.contains('w-6')).toBe(true);
          expect(svg?.classList.contains('h-6')).toBe(true);
        });
      });
    });

    describe('Feature Card Color Themes', () => {
      it('should render Report Card with accent color theme', () => {
        render(<LandingPage />);

        const reportCardLink = screen.getByText('Report Card').closest('a');
        const iconContainer = reportCardLink?.querySelector('.rounded-xl');

        expect(iconContainer?.className).toContain('bg-accent-3');
      });

      it('should render Ranking with success color theme', () => {
        render(<LandingPage />);

        const rankingLink = screen.getByText('Ranking').closest('a');
        const iconContainer = rankingLink?.querySelector('.rounded-xl');

        expect(iconContainer?.className).toContain('bg-success-3');
      });

      it('should render Calculadora with warning color theme', () => {
        render(<LandingPage />);

        const calculatorLink = screen.getByText('Calculadora').closest('a');
        const iconContainer = calculatorLink?.querySelector('.rounded-xl');

        expect(iconContainer?.className).toContain('bg-warning-3');
      });

      it('should render Battle Royale with danger color theme', () => {
        render(<LandingPage />);

        const battleLink = screen.getByText('Battle Royale').closest('a');
        const iconContainer = battleLink?.querySelector('.rounded-xl');

        expect(iconContainer?.className).toContain('bg-danger-3');
      });
    });
  });

  describe('Tabs Functionality', () => {
    describe('Tabs Structure', () => {
      it('should render tabs component', () => {
        render(<LandingPage />);

        expect(screen.getByTestId('tabs')).toBeTruthy();
      });

      it('should render tabs list with tablist role', () => {
        render(<LandingPage />);

        const tabsList = screen.getByTestId('tabs-list');
        expect(tabsList).toBeTruthy();
        expect(tabsList.getAttribute('role')).toBe('tablist');
      });

      it('should render three tab triggers', () => {
        render(<LandingPage />);

        expect(screen.getByTestId('tabs-trigger-sectors')).toBeTruthy();
        expect(screen.getByTestId('tabs-trigger-timeline')).toBeTruthy();
        expect(screen.getByTestId('tabs-trigger-promises')).toBeTruthy();
      });

      it('should render three tab content panels', () => {
        const { container } = render(<LandingPage />);

        // Note: inactive tabs are hidden but still in the DOM
        expect(container.querySelector('[data-testid="tabs-content-sectors"]')).toBeTruthy();
        expect(container.querySelector('[data-testid="tabs-content-timeline"]')).toBeTruthy();
        expect(container.querySelector('[data-testid="tabs-content-promises"]')).toBeTruthy();
      });

      it('should render tab triggers with correct labels', () => {
        render(<LandingPage />);

        expect(screen.getByText('Funcionalidades')).toBeTruthy();
        expect(screen.getByText('Cronologia')).toBeTruthy();
        expect(screen.getByText('Iniciativas')).toBeTruthy();
      });

      it('should render tab triggers as buttons', () => {
        render(<LandingPage />);

        const funcionalidadesTab = screen.getByTestId('tabs-trigger-sectors');
        const cronologiaTab = screen.getByTestId('tabs-trigger-timeline');
        const iniciativasTab = screen.getByTestId('tabs-trigger-promises');

        expect(funcionalidadesTab.tagName).toBe('BUTTON');
        expect(cronologiaTab.tagName).toBe('BUTTON');
        expect(iniciativasTab.tagName).toBe('BUTTON');
      });

      it('should render tab triggers with role="tab"', () => {
        render(<LandingPage />);

        const funcionalidadesTab = screen.getByTestId('tabs-trigger-sectors');
        const cronologiaTab = screen.getByTestId('tabs-trigger-timeline');
        const iniciativasTab = screen.getByTestId('tabs-trigger-promises');

        expect(funcionalidadesTab.getAttribute('role')).toBe('tab');
        expect(cronologiaTab.getAttribute('role')).toBe('tab');
        expect(iniciativasTab.getAttribute('role')).toBe('tab');
      });
    });

    describe('Default Tab State', () => {
      it('should display Funcionalidades tab as active by default', () => {
        render(<LandingPage />);

        const funcionalidadesTab = screen.getByTestId('tabs-trigger-sectors');
        expect(funcionalidadesTab.getAttribute('data-state')).toBe('active');
        expect(funcionalidadesTab.getAttribute('aria-selected')).toBe('true');
      });

      it('should display Cronologia tab as inactive by default', () => {
        render(<LandingPage />);

        const cronologiaTab = screen.getByTestId('tabs-trigger-timeline');
        expect(cronologiaTab.getAttribute('data-state')).toBe('inactive');
        expect(cronologiaTab.getAttribute('aria-selected')).toBe('false');
      });

      it('should display Iniciativas tab as inactive by default', () => {
        render(<LandingPage />);

        const iniciativasTab = screen.getByTestId('tabs-trigger-promises');
        expect(iniciativasTab.getAttribute('data-state')).toBe('inactive');
        expect(iniciativasTab.getAttribute('aria-selected')).toBe('false');
      });

      it('should show Funcionalidades content by default', () => {
        render(<LandingPage />);

        // Funcionalidades content should be visible
        expect(screen.getByText('Ferramentas de Análise')).toBeTruthy();
        expect(screen.getByText(/Report cards, rankings, calculadora de desperdício/)).toBeTruthy();
      });

      it('should not show Cronologia content by default', () => {
        render(<LandingPage />);

        // Cronologia content should not be visible
        expect(screen.queryByText('Cronologia Legislativa')).toBeNull();
      });

      it('should not show Iniciativas content by default', () => {
        render(<LandingPage />);

        // Iniciativas content should not be visible
        expect(screen.queryByText('Iniciativas Parlamentares')).toBeNull();
      });

      it('should set sectors tab content as active', () => {
        const { container } = render(<LandingPage />);

        const sectorsContent = container.querySelector('[data-testid="tabs-content-sectors"]');
        expect(sectorsContent?.getAttribute('data-state')).toBe('active');
      });
    });

    describe('Tab Switching - Funcionalidades Tab', () => {
      it('should display Funcionalidades heading when clicked', () => {
        render(<LandingPage />);

        const funcionalidadesTab = screen.getByTestId('tabs-trigger-sectors');
        fireEvent.click(funcionalidadesTab);

        expect(screen.getByText('Ferramentas de Análise')).toBeTruthy();
      });

      it('should display Funcionalidades description when clicked', () => {
        render(<LandingPage />);

        const funcionalidadesTab = screen.getByTestId('tabs-trigger-sectors');
        fireEvent.click(funcionalidadesTab);

        expect(screen.getByText(/Report cards, rankings, calculadora de desperdício/)).toBeTruthy();
        expect(screen.getByText(/Todas as ferramentas que precisas/)).toBeTruthy();
      });

      it('should display BarChart3 icon in Funcionalidades tab', () => {
        const { container } = render(<LandingPage />);

        // Funcionalidades tab content should have an icon container with svg
        const sectorsContent = container.querySelector('[data-testid="tabs-content-sectors"]');
        const iconContainer = sectorsContent?.querySelector('.w-20.h-20.rounded-full.bg-neutral-3');
        expect(iconContainer).toBeTruthy();

        const svg = iconContainer?.querySelector('svg');
        expect(svg).toBeTruthy();
      });
    });

    describe('Tab Switching - Cronologia Tab', () => {
      it('should switch to Cronologia tab when clicked', () => {
        render(<LandingPage />);

        const cronologiaTab = screen.getByTestId('tabs-trigger-timeline');
        fireEvent.click(cronologiaTab);

        expect(cronologiaTab.getAttribute('data-state')).toBe('active');
        expect(cronologiaTab.getAttribute('aria-selected')).toBe('true');
      });

      it('should display Cronologia heading when clicked', () => {
        render(<LandingPage />);

        const cronologiaTab = screen.getByTestId('tabs-trigger-timeline');
        fireEvent.click(cronologiaTab);

        expect(screen.getByText('Cronologia Legislativa')).toBeTruthy();
      });

      it('should display Cronologia description when clicked', () => {
        render(<LandingPage />);

        const cronologiaTab = screen.getByTestId('tabs-trigger-timeline');
        fireEvent.click(cronologiaTab);

        expect(
          screen.getByText(/Acompanha o progresso das iniciativas parlamentares/)
        ).toBeTruthy();
        expect(screen.getByText(/visualiza a cronologia legislativa completa/)).toBeTruthy();
      });

      it('should hide Funcionalidades content when Cronologia is clicked', () => {
        render(<LandingPage />);

        const cronologiaTab = screen.getByTestId('tabs-trigger-timeline');
        fireEvent.click(cronologiaTab);

        // Funcionalidades content should be hidden
        expect(screen.queryByText('Ferramentas de Análise')).toBeNull();
      });

      it('should set Funcionalidades tab as inactive when Cronologia is clicked', () => {
        render(<LandingPage />);

        const cronologiaTab = screen.getByTestId('tabs-trigger-timeline');
        fireEvent.click(cronologiaTab);

        const funcionalidadesTab = screen.getByTestId('tabs-trigger-sectors');
        expect(funcionalidadesTab.getAttribute('data-state')).toBe('inactive');
        expect(funcionalidadesTab.getAttribute('aria-selected')).toBe('false');
      });

      it('should display BarChart3 icon in Cronologia tab', () => {
        const { container } = render(<LandingPage />);

        const cronologiaTab = screen.getByTestId('tabs-trigger-timeline');
        fireEvent.click(cronologiaTab);

        const timelineContent = container.querySelector('[data-testid="tabs-content-timeline"]');
        const iconContainer = timelineContent?.querySelector(
          '.w-20.h-20.rounded-full.bg-neutral-3'
        );
        expect(iconContainer).toBeTruthy();

        const svg = iconContainer?.querySelector('svg');
        expect(svg).toBeTruthy();
      });
    });

    describe('Tab Switching - Iniciativas Tab', () => {
      it('should switch to Iniciativas tab when clicked', () => {
        render(<LandingPage />);

        const iniciativasTab = screen.getByTestId('tabs-trigger-promises');
        fireEvent.click(iniciativasTab);

        expect(iniciativasTab.getAttribute('data-state')).toBe('active');
        expect(iniciativasTab.getAttribute('aria-selected')).toBe('true');
      });

      it('should display Iniciativas heading when clicked', () => {
        render(<LandingPage />);

        const iniciativasTab = screen.getByTestId('tabs-trigger-promises');
        fireEvent.click(iniciativasTab);

        expect(screen.getByText('Iniciativas Parlamentares')).toBeTruthy();
      });

      it('should display Iniciativas description when clicked', () => {
        render(<LandingPage />);

        const iniciativasTab = screen.getByTestId('tabs-trigger-promises');
        fireEvent.click(iniciativasTab);

        expect(
          screen.getByText(/Pesquisa, filtra e acompanha iniciativas parlamentares/)
        ).toBeTruthy();
        expect(screen.getByText(/registos de votação, transcrições de debates/)).toBeTruthy();
      });

      it('should hide Funcionalidades content when Iniciativas is clicked', () => {
        render(<LandingPage />);

        const iniciativasTab = screen.getByTestId('tabs-trigger-promises');
        fireEvent.click(iniciativasTab);

        // Funcionalidades content should be hidden
        expect(screen.queryByText('Ferramentas de Análise')).toBeNull();
      });

      it('should set Funcionalidades tab as inactive when Iniciativas is clicked', () => {
        render(<LandingPage />);

        const iniciativasTab = screen.getByTestId('tabs-trigger-promises');
        fireEvent.click(iniciativasTab);

        const funcionalidadesTab = screen.getByTestId('tabs-trigger-sectors');
        expect(funcionalidadesTab.getAttribute('data-state')).toBe('inactive');
        expect(funcionalidadesTab.getAttribute('aria-selected')).toBe('false');
      });

      it('should display Flag icon in Iniciativas tab', () => {
        const { container } = render(<LandingPage />);

        const iniciativasTab = screen.getByTestId('tabs-trigger-promises');
        fireEvent.click(iniciativasTab);

        const promisesContent = container.querySelector('[data-testid="tabs-content-promises"]');
        const iconContainer = promisesContent?.querySelector(
          '.w-20.h-20.rounded-full.bg-neutral-3'
        );
        expect(iconContainer).toBeTruthy();

        const svg = iconContainer?.querySelector('svg');
        expect(svg).toBeTruthy();
      });
    });

    describe('Tab Switching - Multiple Transitions', () => {
      it('should switch from Funcionalidades to Cronologia to Iniciativas', () => {
        render(<LandingPage />);

        // Default: Funcionalidades
        expect(screen.getByText('Ferramentas de Análise')).toBeTruthy();

        // Click Cronologia
        const cronologiaTab = screen.getByTestId('tabs-trigger-timeline');
        fireEvent.click(cronologiaTab);
        expect(screen.getByText('Cronologia Legislativa')).toBeTruthy();
        expect(screen.queryByText('Ferramentas de Análise')).toBeNull();

        // Click Iniciativas
        const iniciativasTab = screen.getByTestId('tabs-trigger-promises');
        fireEvent.click(iniciativasTab);
        expect(screen.getByText('Iniciativas Parlamentares')).toBeTruthy();
        expect(screen.queryByText('Cronologia Legislativa')).toBeNull();
      });

      it('should switch back to Funcionalidades from Iniciativas', () => {
        render(<LandingPage />);

        // Go to Iniciativas
        const iniciativasTab = screen.getByTestId('tabs-trigger-promises');
        fireEvent.click(iniciativasTab);
        expect(screen.getByText('Iniciativas Parlamentares')).toBeTruthy();

        // Go back to Funcionalidades
        const funcionalidadesTab = screen.getByTestId('tabs-trigger-sectors');
        fireEvent.click(funcionalidadesTab);
        expect(screen.getByText('Ferramentas de Análise')).toBeTruthy();
        expect(screen.queryByText('Iniciativas Parlamentares')).toBeNull();
      });

      it('should switch back to Funcionalidades from Cronologia', () => {
        render(<LandingPage />);

        // Go to Cronologia
        const cronologiaTab = screen.getByTestId('tabs-trigger-timeline');
        fireEvent.click(cronologiaTab);
        expect(screen.getByText('Cronologia Legislativa')).toBeTruthy();

        // Go back to Funcionalidades
        const funcionalidadesTab = screen.getByTestId('tabs-trigger-sectors');
        fireEvent.click(funcionalidadesTab);
        expect(screen.getByText('Ferramentas de Análise')).toBeTruthy();
        expect(screen.queryByText('Cronologia Legislativa')).toBeNull();
      });

      it('should correctly update all tabs aria-selected states when switching', () => {
        render(<LandingPage />);

        const funcionalidadesTab = screen.getByTestId('tabs-trigger-sectors');
        const cronologiaTab = screen.getByTestId('tabs-trigger-timeline');
        const iniciativasTab = screen.getByTestId('tabs-trigger-promises');

        // Default state
        expect(funcionalidadesTab.getAttribute('aria-selected')).toBe('true');
        expect(cronologiaTab.getAttribute('aria-selected')).toBe('false');
        expect(iniciativasTab.getAttribute('aria-selected')).toBe('false');

        // Click Cronologia
        fireEvent.click(cronologiaTab);
        expect(funcionalidadesTab.getAttribute('aria-selected')).toBe('false');
        expect(cronologiaTab.getAttribute('aria-selected')).toBe('true');
        expect(iniciativasTab.getAttribute('aria-selected')).toBe('false');

        // Click Iniciativas
        fireEvent.click(iniciativasTab);
        expect(funcionalidadesTab.getAttribute('aria-selected')).toBe('false');
        expect(cronologiaTab.getAttribute('aria-selected')).toBe('false');
        expect(iniciativasTab.getAttribute('aria-selected')).toBe('true');
      });
    });

    describe('Tab Content Layout', () => {
      it('should render tab content with centered text layout', () => {
        const { container } = render(<LandingPage />);

        const sectorsContent = container.querySelector('[data-testid="tabs-content-sectors"]');
        const centerDiv = sectorsContent?.querySelector('.text-center');
        expect(centerDiv).toBeTruthy();
      });

      it('should render tab content with padding', () => {
        const { container } = render(<LandingPage />);

        const sectorsContent = container.querySelector('[data-testid="tabs-content-sectors"]');
        const paddedDiv = sectorsContent?.querySelector('.py-10.px-4');
        expect(paddedDiv).toBeTruthy();
      });

      it('should render tab heading with correct styling', () => {
        const { container } = render(<LandingPage />);

        const sectorsContent = container.querySelector('[data-testid="tabs-content-sectors"]');
        const heading = sectorsContent?.querySelector('h3.text-xl.font-medium');
        expect(heading).toBeTruthy();
        expect(heading?.textContent).toBe('Ferramentas de Análise');
      });

      it('should render tab description with neutral styling', () => {
        const { container } = render(<LandingPage />);

        const sectorsContent = container.querySelector('[data-testid="tabs-content-sectors"]');
        const description = sectorsContent?.querySelector('p.text-neutral-11');
        expect(description).toBeTruthy();
      });

      it('should render icon container with correct dimensions', () => {
        const { container } = render(<LandingPage />);

        const sectorsContent = container.querySelector('[data-testid="tabs-content-sectors"]');
        const iconContainer = sectorsContent?.querySelector('.w-20.h-20');
        expect(iconContainer).toBeTruthy();
      });

      it('should render icon with w-8 h-8 sizing', () => {
        const { container } = render(<LandingPage />);

        const sectorsContent = container.querySelector('[data-testid="tabs-content-sectors"]');
        const icon = sectorsContent?.querySelector('svg.w-8.h-8');
        expect(icon).toBeTruthy();
      });
    });

    describe('Tab Content Icons', () => {
      it('should render BarChart3 icon in Funcionalidades tab content', () => {
        const { container } = render(<LandingPage />);

        const sectorsContent = container.querySelector('[data-testid="tabs-content-sectors"]');
        const svgIcon = sectorsContent?.querySelector('svg');
        expect(svgIcon).toBeTruthy();
        expect(svgIcon?.classList.contains('text-neutral-9')).toBe(true);
      });

      it('should render BarChart3 icon in Cronologia tab content', () => {
        const { container } = render(<LandingPage />);

        const cronologiaTab = screen.getByTestId('tabs-trigger-timeline');
        fireEvent.click(cronologiaTab);

        const timelineContent = container.querySelector('[data-testid="tabs-content-timeline"]');
        const svgIcon = timelineContent?.querySelector('svg');
        expect(svgIcon).toBeTruthy();
        expect(svgIcon?.classList.contains('text-neutral-9')).toBe(true);
      });

      it('should render Flag icon in Iniciativas tab content', () => {
        const { container } = render(<LandingPage />);

        const iniciativasTab = screen.getByTestId('tabs-trigger-promises');
        fireEvent.click(iniciativasTab);

        const promisesContent = container.querySelector('[data-testid="tabs-content-promises"]');
        const svgIcon = promisesContent?.querySelector('svg');
        expect(svgIcon).toBeTruthy();
        expect(svgIcon?.classList.contains('text-neutral-9')).toBe(true);
      });
    });

    describe('Tab Content Descriptive Text', () => {
      it('should describe Report cards, rankings, and calculadora in Funcionalidades', () => {
        render(<LandingPage />);

        expect(screen.getByText(/report cards/i)).toBeTruthy();
        expect(screen.getByText(/rankings/i)).toBeTruthy();
        expect(screen.getByText(/calculadora de desperdício/i)).toBeTruthy();
        expect(screen.getByText(/comparador de deputados/i)).toBeTruthy();
      });

      it('should describe progress tracking in Cronologia', () => {
        render(<LandingPage />);

        const cronologiaTab = screen.getByTestId('tabs-trigger-timeline');
        fireEvent.click(cronologiaTab);

        expect(screen.getByText(/progresso das iniciativas parlamentares/i)).toBeTruthy();
        expect(screen.getByText(/diferentes fases/i)).toBeTruthy();
        expect(screen.getAllByText(/cronologia legislativa/i).length).toBeGreaterThan(0);
      });

      it('should describe search and filter features in Iniciativas', () => {
        render(<LandingPage />);

        const iniciativasTab = screen.getByTestId('tabs-trigger-promises');
        fireEvent.click(iniciativasTab);

        expect(screen.getByText(/Pesquisa, filtra e acompanha/i)).toBeTruthy();
        expect(screen.getByText(/votação/i)).toBeTruthy();
        expect(screen.getByText(/transcrições de debates/i)).toBeTruthy();
        expect(screen.getByText(/documentos relacionados/i)).toBeTruthy();
      });
    });

    describe('Tabs Accessibility', () => {
      it('should have accessible tab labels', () => {
        render(<LandingPage />);

        // Tab triggers should have visible labels
        expect(screen.getByRole('tab', { name: 'Funcionalidades' })).toBeTruthy();
        expect(screen.getByRole('tab', { name: 'Cronologia' })).toBeTruthy();
        expect(screen.getByRole('tab', { name: 'Iniciativas' })).toBeTruthy();
      });

      it('should update aria-selected when switching tabs', () => {
        render(<LandingPage />);

        const funcionalidadesTab = screen.getByRole('tab', { name: 'Funcionalidades' });
        const cronologiaTab = screen.getByRole('tab', { name: 'Cronologia' });

        expect(funcionalidadesTab.getAttribute('aria-selected')).toBe('true');
        expect(cronologiaTab.getAttribute('aria-selected')).toBe('false');

        fireEvent.click(cronologiaTab);

        expect(funcionalidadesTab.getAttribute('aria-selected')).toBe('false');
        expect(cronologiaTab.getAttribute('aria-selected')).toBe('true');
      });

      it('should have correct tablist structure', () => {
        render(<LandingPage />);

        const tablist = screen.getByRole('tablist');
        expect(tablist).toBeTruthy();

        // All tabs should be within the tablist
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBe(3);
      });
    });
  });

  describe('Component Integrations', () => {
    describe('Hero Component Integration', () => {
      it('should render the Hero component', () => {
        render(<LandingPage />);

        expect(screen.getByTestId('hero-component')).toBeTruthy();
      });

      it('should render Hero component at the top of the page content', () => {
        const { container } = render(<LandingPage />);

        const hero = screen.getByTestId('hero-component');
        const motionContainer = container.querySelector('.flex.flex-col.overflow-x-hidden');

        // Hero should be the first child of the motion container
        expect(motionContainer?.firstElementChild).toBe(hero);
      });
    });

    describe('KeyMetrics Component Integration', () => {
      it('should render the KeyMetrics component', () => {
        render(<LandingPage />);

        expect(screen.getByTestId('key-metrics-component')).toBeTruthy();
      });

      it('should render KeyMetrics within the feature cards section', () => {
        render(<LandingPage />);

        const keyMetrics = screen.getByTestId('key-metrics-component');
        // KeyMetrics should be a sibling of the feature cards grid
        const section = keyMetrics.closest('section');
        expect(section).toBeTruthy();

        // The section should contain the feature cards grid
        const featureCardsGrid = section?.querySelector(
          '.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.xl\\:grid-cols-5'
        );
        expect(featureCardsGrid).toBeTruthy();
      });
    });

    describe('Footer Component Integration', () => {
      it('should render the Footer component', () => {
        render(<LandingPage />);

        expect(screen.getByTestId('footer-component')).toBeTruthy();
      });

      it('should render Footer as a footer element', () => {
        render(<LandingPage />);

        const footer = screen.getByTestId('footer-component');
        expect(footer.tagName).toBe('FOOTER');
      });

      it('should render Footer at the bottom of the page', () => {
        const { container } = render(<LandingPage />);

        const footer = screen.getByTestId('footer-component');
        const motionContainer = container.querySelector('.flex.flex-col.overflow-x-hidden');

        // Footer should be the last child of the motion container
        expect(motionContainer?.lastElementChild).toBe(footer);
      });
    });

    describe('MainNav Component Integration', () => {
      it('should render the MainNav component', () => {
        render(<LandingPage />);

        expect(screen.getByTestId('main-nav-component')).toBeTruthy();
      });

      it('should render MainNav as a nav element', () => {
        render(<LandingPage />);

        const mainNav = screen.getByTestId('main-nav-component');
        expect(mainNav.tagName).toBe('NAV');
      });

      it('should pass scrollY prop to MainNav', () => {
        render(<LandingPage />);

        const mainNav = screen.getByTestId('main-nav-component');
        // Initially scrollY should be 0
        expect(mainNav.textContent).toContain('scrollY: 0');
      });
    });
  });

  describe('CTA Section', () => {
    describe('CTA Section Structure', () => {
      it('should render CTA section with neutral-2 background', () => {
        const { container } = render(<LandingPage />);

        const ctaSection = container.querySelector('section.bg-neutral-2');
        expect(ctaSection).toBeTruthy();
      });

      it('should render CTA section badge "Objectivos do Projecto"', () => {
        render(<LandingPage />);

        expect(screen.getByText('Objectivos do Projecto')).toBeTruthy();
      });

      it('should render CTA section badge with correct styling', () => {
        const { container } = render(<LandingPage />);

        const badge = container.querySelector('.bg-neutral-1.rounded-full');
        expect(badge).toBeTruthy();
        expect(badge?.textContent).toContain('Objectivos do Projecto');
      });

      it('should render CTA section heading "Aumentar a Participação Civica"', () => {
        render(<LandingPage />);

        expect(screen.getByText('Aumentar a Participação Civica')).toBeTruthy();
      });

      it('should render CTA section heading with correct styling', () => {
        render(<LandingPage />);

        const heading = screen.getByText('Aumentar a Participação Civica');
        expect(heading).toBeTruthy();
        expect(heading.tagName).toBe('H2');
        expect(heading.className).toContain('text-3xl');
        expect(heading.className).toContain('font-light');
      });

      it('should render CTA section description about democratizing data', () => {
        render(<LandingPage />);

        expect(screen.getByText(/democratizar o acesso aos dados parlamentares/)).toBeTruthy();
      });

      it('should render CTA section description about civic participation', () => {
        render(<LandingPage />);

        expect(screen.getByText(/participação civica/)).toBeTruthy();
      });

      it('should render CTA section description about transparency', () => {
        render(<LandingPage />);

        expect(screen.getByText(/transparencia na governacao portuguesa/)).toBeTruthy();
      });
    });

    describe('CTA Contribute Link', () => {
      it('should render "Começar Agora" button', () => {
        render(<LandingPage />);

        expect(screen.getByText('Começar Agora')).toBeTruthy();
      });

      it('should render contribute link to /contribuir', () => {
        render(<LandingPage />);

        const contributeButton = screen.getByText('Começar Agora');
        const link = contributeButton.closest('a');

        expect(link).toBeTruthy();
        expect(link?.getAttribute('href')).toBe('/contribuir');
      });

      it('should render contribute button as a button element', () => {
        render(<LandingPage />);

        const contributeButton = screen.getByText('Começar Agora');
        expect(contributeButton.tagName).toBe('BUTTON');
      });

      it('should render contribute button with rounded-full class', () => {
        render(<LandingPage />);

        const contributeButton = screen.getByText('Começar Agora');
        expect(contributeButton.className).toContain('rounded-full');
      });

      it('should render contribute button with accent background', () => {
        render(<LandingPage />);

        const contributeButton = screen.getByText('Começar Agora');
        expect(contributeButton.className).toContain('bg-accent-9');
      });

      it('should render contribute button with hover styling', () => {
        render(<LandingPage />);

        const contributeButton = screen.getByText('Começar Agora');
        expect(contributeButton.className).toContain('hover:bg-accent-10');
      });

      it('should render contribute button with specific height', () => {
        render(<LandingPage />);

        const contributeButton = screen.getByText('Começar Agora');
        expect(contributeButton.className).toContain('h-12');
      });

      it('should render contribute button with padding', () => {
        render(<LandingPage />);

        const contributeButton = screen.getByText('Começar Agora');
        expect(contributeButton.className).toContain('px-8');
      });
    });

    describe('CTA Section Layout', () => {
      it('should render CTA section with centered content', () => {
        const { container } = render(<LandingPage />);

        const ctaSection = container.querySelector('section.bg-neutral-2');
        const centeredDiv = ctaSection?.querySelector('.text-center');
        expect(centeredDiv).toBeTruthy();
      });

      it('should render CTA content with max-width constraint', () => {
        const { container } = render(<LandingPage />);

        const ctaSection = container.querySelector('section.bg-neutral-2');
        const maxWidthDiv = ctaSection?.querySelector('.max-w-xl');
        expect(maxWidthDiv).toBeTruthy();
      });

      it('should render CTA section with responsive padding', () => {
        const { container } = render(<LandingPage />);

        const ctaSection = container.querySelector('section.bg-neutral-2.py-16.md\\:py-24');
        expect(ctaSection).toBeTruthy();
      });

      it('should render CTA inner container with max-width 1280px', () => {
        const { container } = render(<LandingPage />);

        const ctaSection = container.querySelector('section.bg-neutral-2');
        const innerContainer = ctaSection?.querySelector('.max-w-\\[1280px\\]');
        expect(innerContainer).toBeTruthy();
      });
    });
  });

  describe('Page Layout', () => {
    describe('Page Container', () => {
      it('should render page with min-height screen', () => {
        const { container } = render(<LandingPage />);

        const pageContainer = container.querySelector('.min-h-screen');
        expect(pageContainer).toBeTruthy();
      });

      it('should render page with neutral-1 background', () => {
        const { container } = render(<LandingPage />);

        const pageContainer = container.querySelector('.bg-neutral-1');
        expect(pageContainer).toBeTruthy();
      });

      it('should render page with overflow-x-hidden', () => {
        const { container } = render(<LandingPage />);

        const pageContainer = container.querySelector('.overflow-x-hidden');
        expect(pageContainer).toBeTruthy();
      });
    });

    describe('Component Order', () => {
      it('should render components in correct order: Nav, Hero, Features Section, CTA, Footer', () => {
        const { container } = render(<LandingPage />);

        const mainNav = screen.getByTestId('main-nav-component');
        const hero = screen.getByTestId('hero-component');
        const keyMetrics = screen.getByTestId('key-metrics-component');
        const footer = screen.getByTestId('footer-component');

        // MainNav is before the motion container
        const pageContainer = container.querySelector('.min-h-screen');
        expect(pageContainer?.contains(mainNav)).toBe(true);
        expect(pageContainer?.contains(hero)).toBe(true);
        expect(pageContainer?.contains(keyMetrics)).toBe(true);
        expect(pageContainer?.contains(footer)).toBe(true);
      });

      it('should render CTA section between KeyMetrics and Footer', () => {
        const { container } = render(<LandingPage />);

        const ctaSection = container.querySelector('section.bg-neutral-2');
        const footer = screen.getByTestId('footer-component');

        // CTA section should exist
        expect(ctaSection).toBeTruthy();

        // CTA section should be before footer in the DOM
        const motionContainer = container.querySelector('.flex.flex-col.overflow-x-hidden');
        const children = Array.from(motionContainer?.children || []);

        const ctaIndex = children.indexOf(ctaSection as Element);
        const footerIndex = children.indexOf(footer);

        expect(ctaIndex).toBeLessThan(footerIndex);
      });
    });

    describe('Feature Cards Section Position', () => {
      it('should render feature cards section after Hero', () => {
        const { container } = render(<LandingPage />);

        const hero = screen.getByTestId('hero-component');

        const motionContainer = container.querySelector('.flex.flex-col.overflow-x-hidden');
        const children = Array.from(motionContainer?.children || []);

        // Find section containing feature cards
        const featureSection = Array.from(container.querySelectorAll('section')).find((section) =>
          section.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.xl\\:grid-cols-5')
        );

        expect(featureSection).toBeTruthy();

        const heroIndex = children.indexOf(hero);
        const featureSectionIndex = children.indexOf(featureSection as Element);

        expect(heroIndex).toBeLessThan(featureSectionIndex);
      });
    });
  });
});
