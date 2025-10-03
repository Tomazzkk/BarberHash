import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const breadcrumbNameMap: { [key: string]: string } = {
  'dashboard': 'Dashboard',
  'agenda': 'Agenda',
  'pdv': 'PDV',
  'clientes': 'Clientes',
  'relatorios-clientes': 'Relatórios de Clientes',
  'relatorios-desempenho': 'Desempenho da Equipe',
  'avaliacoes': 'Avaliações',
  'servicos': 'Serviços',
  'barbeiros': 'Barbeiros',
  'estoque': 'Estoque',
  'financeiro': 'Financeiro',
  'relatorios-comissao': 'Relatório de Comissões',
  'promocoes': 'Promoções',
  'marketing': 'Marketing',
  'sedes': 'Sedes',
  'configuracoes': 'Configurações',
  'admin': 'Admin',
  'app': 'App',
  'home': 'Início',
  'agendar': 'Agendar',
  'historico': 'Histórico',
  'referrals': 'Indique e Ganhe',
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav aria-label="breadcrumb" className="hidden md:flex items-center text-sm text-muted-foreground">
      <Link to="/" className="hover:text-primary">Início</Link>
      {pathnames.length > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const name = breadcrumbNameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

        return isLast ? (
          <span key={to} className="font-semibold text-foreground">
            {name}
          </span>
        ) : (
          <span key={to} className="flex items-center">
            <Link to={to} className="hover:text-primary">{name}</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;