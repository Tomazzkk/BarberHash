import { Outlet, useLocation } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppNavigation from './AppNavigation';
import { AnimatePresence, motion } from 'framer-motion';
import AnimatedPatternBackground from '../AnimatedPatternBackground';
import { cn } from '@/lib/utils';

const AppLayout = () => {
  const location = useLocation();
  const showBottomNav = !location.pathname.startsWith('/app/agendar');
  const isHomePage = location.pathname === '/app/home';

  return (
    <div className={cn("min-h-screen text-foreground", !isHomePage && "bg-background")}>
      {isHomePage && (
        <>
          <AnimatedPatternBackground />
          <div className="fixed inset-0 -z-[9] bg-black/50" />
        </>
      )}
      <AppHeader />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className={cn("p-4", showBottomNav ? "pb-20 pt-20" : "pt-20")}
      >
        <Outlet />
      </motion.main>
      <AnimatePresence>
        {showBottomNav && <AppNavigation />}
      </AnimatePresence>
    </div>
  );
};

export default AppLayout;