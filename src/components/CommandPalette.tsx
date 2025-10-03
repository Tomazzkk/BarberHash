import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { navConfig, NavItem } from './layout/Navigation';
import { useSessionStore } from '@/hooks/useSessionStore';

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const { plan, profile, permissions } = useSessionStore();

  const userHasAccess = (item: NavItem) => {
    if (!profile || !item.roles.includes(profile.role)) {
        return false;
    }
    if (profile.role === 'barbeiro' || profile.role === 'supervisor') {
        if (item.href === '/dashboard' || item.href === '/agenda') return true;
        return item.permission ? permissions?.[item.permission] ?? false : false;
    }
    if (item.feature) {
        return plan?.features?.includes(item.feature) ?? false;
    }
    return true;
  };

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Digite um comando ou pesquise..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        {navConfig.map(section => {
            const accessibleItems = section.items.filter(userHasAccess);
            if (accessibleItems.length === 0) return null;
            return (
                <CommandGroup key={section.title} heading={section.title}>
                    {accessibleItems.map(item => (
                        <CommandItem key={item.href} onSelect={() => runCommand(() => navigate(item.href))}>
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.label}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            )
        })}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;