import { Calendar, DollarSign, Users, Scissors, UserCog, LayoutDashboard, Settings, Package, ShoppingCart, BarChart3, Megaphone, PieChart, Star, Home, TicketPercent, TrendingUp, ClipboardList, LifeBuoy, Edit, Smartphone, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useSessionStore, BarberPermissions, ProfileRole } from "@/hooks/useSessionStore";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";

export type NavItem = {
    href: string;
    icon: React.ElementType;
    label: string;
    roles: Array<ProfileRole>;
    feature?: string;
    permission?: keyof BarberPermissions;
}

export type NavSection = {
    title: string;
    items: NavItem[];
};

export const navConfig: NavSection[] = [
    {
        title: "Principal",
        items: [
            { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ['dono', 'barbeiro', 'gerente', 'supervisor'] },
            { href: "/agenda", icon: Calendar, label: "Agenda", roles: ['dono', 'barbeiro', 'gerente', 'supervisor'] },
            { href: "/pdv", icon: ShoppingCart, label: "PDV", feature: "pdv", roles: ['dono', 'gerente'] },
        ]
    },
    {
        title: "Meu App",
        items: [
            { href: "/barbeiros", icon: UserCog, label: "Barbeiros", roles: ['dono', 'gerente'] },
            { href: "/servicos", icon: Scissors, label: "Serviços", roles: ['dono', 'barbeiro', 'gerente', 'supervisor'], permission: 'pode_editar_servicos' },
            { href: "/sedes", icon: Home, label: "Sedes", roles: ['dono', 'gerente'] },
            { href: "/produtos", icon: Package, label: "Produtos", roles: ['dono', 'gerente'] },
            { href: "/plan-management", icon: Edit, label: "Planos", roles: ['dono'] },
            { href: "/promocoes", icon: TicketPercent, label: "Promoções", roles: ['dono', 'gerente'] },
            { href: "/marketing", icon: Megaphone, label: "Campanhas", roles: ['dono', 'gerente'] },
        ]
    },
    {
        title: "Gestão",
        items: [
            { href: "/clientes", icon: Users, label: "Clientes", roles: ['dono', 'barbeiro', 'gerente', 'supervisor'], permission: 'pode_gerenciar_clientes' },
            { href: "/avaliacoes", icon: Star, label: "Avaliações", roles: ['dono', 'gerente'] },
        ]
    },
    {
        title: "Relatórios",
        items: [
            { href: "/relatorios-clientes", icon: BarChart3, label: "Clientes", roles: ['dono', 'barbeiro', 'gerente', 'supervisor'], permission: 'pode_gerenciar_clientes' },
            { href: "/relatorios-desempenho", icon: TrendingUp, label: "Desempenho", roles: ['dono', 'gerente'] },
            { href: "/relatorios-comissao", icon: PieChart, label: "Comissões", roles: ['dono', 'gerente'] },
        ]
    },
    {
        title: "Financeiro",
        items: [
            { href: "/financeiro", icon: DollarSign, label: "Fluxo de Caixa", roles: ['dono', 'barbeiro', 'gerente', 'supervisor'], permission: 'pode_ver_financeiro_completo' },
        ]
    },
    {
        title: "Sistema",
        items: [
            { href: "/activity-log", icon: ClipboardList, label: "Registro de Atividades", roles: ['dono', 'gerente'] },
            { href: "/suporte", icon: LifeBuoy, label: "Ajuda & Suporte", roles: ['dono', 'gerente'] },
            { href: "/plano", icon: Package, label: "Meu Plano", roles: ['dono', 'gerente', 'supervisor'] },
            { href: "/configuracoes", icon: User, label: "Meu Perfil", roles: ['barbeiro', 'supervisor'] },
            { href: "/configuracoes", icon: Settings, label: "Configurações", roles: ['dono', 'gerente', 'admin'] },
        ]
    }
];

const Navigation = () => {
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

    const NavLinkItem = ({ item }: { item: NavItem }) => (
        <motion.div whileHover={{ x: 4 }}>
            <NavLink
                to={item.href}
                className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                        isActive ? "bg-muted text-primary" : ""
                    }`
                }
            >
                <item.icon className="h-4 w-4" />
                {item.label}
            </NavLink>
        </motion.div>
    );

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navConfig[0].items.map((item) => userHasAccess(item) && <NavLinkItem key={item.label} item={item} />)}
            
            <Accordion type="multiple" className="w-full" defaultValue={["Meu App"]}>
                {navConfig.slice(1).map((section) => {
                    const accessibleItems = section.items.filter(userHasAccess);
                    if (accessibleItems.length === 0) return null;
                    return (
                        <AccordionItem value={section.title} key={section.title}>
                            <AccordionTrigger className="px-3 text-xs font-semibold uppercase text-muted-foreground hover:no-underline">
                                {section.title}
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                                <div className="grid items-start">
                                    {accessibleItems.map((item) => <NavLinkItem key={item.label} item={item} />)}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        </nav>
    );
};

export default Navigation;