import { NavLink } from 'react-router-dom';
import { Home, Calendar, History, Award, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSessionStore } from '@/hooks/useSessionStore';

const navItems = [
  { to: '/app/home', icon: Home, label: 'Início' },
  { to: '/app/agendar', icon: Calendar, label: 'Agendar' },
  { to: '/app/historico', icon: History, label: 'Histórico' },
  { to: '/app/planos', icon: Award, label: 'Planos' },
  { to: '/app/profile', icon: User, label: 'Perfil' },
];

const AppNavigation = () => {
  const { config, selectedSede } = useSessionStore();

  const filteredNavItems = navItems.filter(item => {
    if (item.to === '/app/planos') {
      return config?.plan_feature_enabled;
    }
    return true;
  });

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/80 backdrop-blur-sm"
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
    >
      <div className="grid h-16 items-center" style={{ gridTemplateColumns: `repeat(${filteredNavItems.length}, minmax(0, 1fr))` }}>
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            state={item.to === '/app/agendar' ? { sedeId: selectedSede?.id } : undefined}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </motion.nav>
  );
};

export default AppNavigation;