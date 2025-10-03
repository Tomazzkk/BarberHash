import React from 'react';
import Logo from '../Logo';
import { Button } from '../ui/button';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const AppHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
      <Logo />
      <Button variant="ghost" size="icon" asChild>
        <Link to="/app/configuracoes">
          <Settings className="h-5 w-5" />
        </Link>
      </Button>
    </header>
  );
};

export default AppHeader;