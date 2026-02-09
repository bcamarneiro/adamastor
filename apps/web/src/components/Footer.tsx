import { Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import DebaixoDolhoLogo from './ui/Icons/DebaixoDolhoLogo';

const Footer = () => {
  return (
    <footer className="bg-neutral-12 text-neutral-1 py-16 md:py-20">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-3 group">
              <DebaixoDolhoLogo size="md" className="text-neutral-1" />
              <span className="text-lg font-bold text-neutral-1">Debaixo d'olho</span>
            </Link>
            <p className="mt-4 text-sm text-neutral-9 leading-relaxed max-w-xs">
              Tornando os dados parlamentares acessíveis e transparentes para todos. Projecto
              open-source de cidadania activa.
            </p>
            <a
              href="https://github.com/bcamarneiro/adamastor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-sm text-neutral-8 hover:text-neutral-1 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>Ver no GitHub</span>
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-widest text-neutral-8 mb-5">
              Navegação
            </h3>
            <ul className="space-y-3">
              {[
                { to: '/missao', label: 'A Nossa Missão' },
                { to: '/about', label: 'Sobre' },
                { to: '/contribuir', label: 'Contribuir' },
                { to: '/report-card', label: 'Deputados' },
                { to: '/ranking', label: 'Ranking' },
                { to: '/parliament', label: 'Parlamento' },
                { to: '/initiatives', label: 'Iniciativas' },
                { to: '/desperdicio', label: 'Calculadora' },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-neutral-9 hover:text-neutral-1 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-widest text-neutral-8 mb-5">
              Recursos
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://www.parlamento.pt/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-9 hover:text-neutral-1 transition-colors"
                >
                  Assembleia da República
                </a>
              </li>
              <li>
                <a
                  href="https://www.parlamento.pt/Legislacao/Paginas/ConstituicaoRepublicaPortuguesa.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-9 hover:text-neutral-1 transition-colors"
                >
                  Constituição da República
                </a>
              </li>
              <li>
                <a
                  href="https://www.parlamento.pt/DeputadoGP/Paginas/Deputados.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-9 hover:text-neutral-1 transition-colors"
                >
                  Lista de Deputados
                </a>
              </li>
            </ul>
          </div>

          {/* Data */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-widest text-neutral-8 mb-5">
              Dados
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/metodologia"
                  className="text-sm text-neutral-9 hover:text-neutral-1 transition-colors"
                >
                  Metodologia
                </Link>
              </li>
              <li>
                <span className="text-sm text-neutral-9">Fonte: Dados públicos da AR</span>
              </li>
              <li>
                <span className="text-sm text-neutral-9">Atualização: Diária</span>
              </li>
              <li>
                <a
                  href="https://github.com/bcamarneiro/adamastor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-9 hover:text-neutral-1 transition-colors"
                >
                  Código Fonte (GitHub)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-neutral-7/30 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm text-neutral-9 text-center">
            © {new Date().getFullYear()} Debaixo d'olho. Projecto open-source de cidadania activa.
          </p>
          <p className="text-xs text-neutral-10">v{__APP_VERSION__}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
