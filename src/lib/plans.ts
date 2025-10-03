import { ShoppingCart, Package, DollarSign, Megaphone, Wand2 } from "lucide-react";

export type Feature = {
  id: 'pdv' | 'estoque' | 'financeiro' | 'marketing' | 'ia_marketing';
  label: string;
  description: string;
  icon: React.ElementType;
};

export type FeatureSection = {
  title: string;
  features: Feature[];
};

// This config is for the SaaS features for the barbershop owner
export const featureConfig: FeatureSection[] = [
  {
    title: "Módulos Completos",
    features: [
      {
        id: 'pdv',
        label: 'Ponto de Venda (PDV)',
        description: 'Registre vendas de produtos e serviços rapidamente no balcão.',
        icon: ShoppingCart,
      },
      {
        id: 'estoque',
        label: 'Controle de Estoque',
        description: 'Gerencie o inventário de produtos da sua barbearia.',
        icon: Package,
      },
      {
        id: 'financeiro',
        label: 'Financeiro Completo',
        description: 'Acesse o fluxo de caixa e relatórios financeiros detalhados.',
        icon: DollarSign,
      },
      {
        id: 'marketing',
        label: 'Ferramentas de Marketing',
        description: 'Crie promoções e envie campanhas de WhatsApp.',
        icon: Megaphone,
      },
    ],
  },
  {
    title: "Addons",
    features: [
      {
        id: 'ia_marketing',
        label: 'Assistente de Marketing com IA',
        description: 'Receba sugestões de mensagens para suas campanhas de WhatsApp.',
        icon: Wand2,
      },
    ],
  },
];

export const allFeatures = featureConfig.flatMap(section => section.features);