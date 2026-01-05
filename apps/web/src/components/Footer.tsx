import DebaixoDolhoLogo from '@/components/ui/Icons/DebaixoDolhoLogo';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-white py-16">
      <div className="container px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <DebaixoDolhoLogo size="md" className="text-white" />
              <span className="text-lg font-medium">Debaixo d'olho</span>
            </Link>
            <p className="mt-4 text-sm text-neutral-400">
              Tornando os dados parlamentares acessíveis e transparentes para todos.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-4 text-white">Navegação</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/missao"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  A Nossa Missão
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Sobre
                </Link>
              </li>
              <li>
                <Link
                  to="/contribuir"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Contribuir
                </Link>
              </li>
              <li>
                <Link
                  to="/report-card"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Deputados
                </Link>
              </li>
              <li>
                <Link
                  to="/ranking"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Ranking
                </Link>
              </li>
              <li>
                <Link
                  to="/parliament"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Parlamento
                </Link>
              </li>
              <li>
                <Link
                  to="/initiatives"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Iniciativas
                </Link>
              </li>
              <li>
                <Link
                  to="/desperdicio"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Calculadora
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4 text-white">Recursos</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.parlamento.pt/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Assembleia da República
                </a>
              </li>
              <li>
                <a
                  href="https://www.parlamento.pt/Legislacao/Paginas/ConstituicaoRepublicaPortuguesa.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Constituição da República
                </a>
              </li>
              <li>
                <a
                  href="https://www.parlamento.pt/DeputadoGP/Paginas/Deputados.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Lista de Deputados
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4 text-white">Dados</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/metodologia"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Metodologia
                </Link>
              </li>
              <li>
                <span className="text-sm text-neutral-400">Fonte: Dados públicos da AR</span>
              </li>
              <li>
                <span className="text-sm text-neutral-400">Atualização: Diária</span>
              </li>
              <li>
                <a
                  href="https://github.com/bcamarneiro/adamastor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Código Fonte (GitHub)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-sm text-neutral-400 text-center">
            © {new Date().getFullYear()} Debaixo d'olho. Projecto open-source de cidadania activa.
          </p>
          <p className="text-xs text-neutral-500">v{__APP_VERSION__}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
