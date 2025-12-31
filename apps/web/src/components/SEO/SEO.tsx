import { Helmet } from 'react-helmet-async';

// TODO: Update to actual domain when acquired
const BASE_URL = 'https://debaixodolho.pt';
const SITE_NAME = "Debaixo d'olho";
// Note: For best social sharing, convert og-image.svg to og-image.png (1200x630px)
const DEFAULT_OG_IMAGE = '/og-image.svg';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  children?: React.ReactNode;
  structuredData?: object;
}

/**
 * SEO Component for managing meta tags across all pages
 *
 * @example Basic usage
 * <SEO title="Ranking" description="Ver ranking de deputados" />
 *
 * @example With structured data
 * <SEO
 *   title="João Silva"
 *   description="Perfil do deputado João Silva"
 *   type="profile"
 *   structuredData={{
 *     "@context": "https://schema.org",
 *     "@type": "Person",
 *     "name": "João Silva"
 *   }}
 * />
 */
export function SEO({
  title,
  description = 'Acompanha o trabalho dos deputados portugueses. Descobre quem trabalha mais, quem falta às sessões, e quanto do teu IRS vai para salários de deputados pouco produtivos.',
  image = DEFAULT_OG_IMAGE,
  url,
  type = 'website',
  noindex = false,
  children,
  structuredData,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Fiscaliza o Teu Deputado`;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;
  const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* OpenGraph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="pt_PT" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}

      {/* Additional meta tags passed as children */}
      {children}
    </Helmet>
  );
}

/**
 * Predefined SEO configurations for common pages
 */
export const SEO_CONFIGS = {
  landing: {
    title: undefined, // Uses default with site name
    description:
      'Acompanha o trabalho dos deputados portugueses. Descobre quem trabalha mais, quem falta às sessões, e quanto do teu IRS vai para salários de deputados pouco produtivos.',
  },
  leaderboard: {
    title: 'Ranking de Trabalho',
    description:
      'Ranking completo dos 230 deputados portugueses ordenados por produtividade. Descobre quem são os mais e menos trabalhadores da Assembleia da República.',
  },
  battle: {
    title: 'Battle Royale',
    description:
      'Compara dois deputados portugueses lado a lado. Vê quem trabalha mais, quem falta menos, e quem te representa melhor.',
  },
  waste: {
    title: 'Calculadora de Desperdício',
    description:
      'Descobre quanto do teu IRS vai para salários de deputados pouco produtivos. Calcula o impacto real da falta de trabalho parlamentar.',
  },
  parties: {
    title: 'Partidos',
    description:
      'Compara o desempenho dos partidos políticos portugueses. Vê qual partido tem os deputados mais trabalhadores.',
  },
  districts: {
    title: 'Círculos Eleitorais',
    description:
      'Descobre como trabalham os deputados do teu círculo eleitoral. Compara o desempenho entre distritos.',
  },
  about: {
    title: 'Sobre',
    description:
      "O Debaixo d'olho é uma plataforma independente que monitoriza o trabalho dos deputados portugueses usando dados públicos do Parlamento.",
  },
  mission: {
    title: 'A Nossa Missão',
    description:
      'Somos um projeto apartidário, open source, focado em tornar a informação parlamentar acessível a todos. Transparência, imparcialidade e factos.',
  },
  reportCard: {
    title: 'Descobre o Teu Deputado',
    description:
      'Introduz o teu código postal e descobre quem são os deputados eleitos pelo teu círculo eleitoral. Avalia o trabalho de quem te representa.',
  },
} as const;

/**
 * Generate structured data for Organization (site-wide)
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/debaixo-dolho-logo.svg`,
    description: 'Plataforma independente de monitorização do trabalho dos deputados portugueses',
    sameAs: [],
  };
}

/**
 * Generate structured data for a Deputy profile
 */
export function getDeputySchema(deputy: {
  name: string;
  party?: string | null;
  district?: string | null;
  photoUrl?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: deputy.name,
    jobTitle: 'Deputado à Assembleia da República',
    affiliation: deputy.party
      ? {
          '@type': 'Organization',
          name: deputy.party,
        }
      : undefined,
    workLocation: {
      '@type': 'Place',
      name: 'Assembleia da República',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'PT',
        addressLocality: 'Lisboa',
      },
    },
    image: deputy.photoUrl,
  };
}

/**
 * Generate breadcrumb structured data
 */
export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

export default SEO;
