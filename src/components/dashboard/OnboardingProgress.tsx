import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type OnboardingStep = {
  isCompleted: boolean;
  title: string;
  description: string;
  link: string;
};

const OnboardingProgress = () => {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [allCompleted, setAllCompleted] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      setLoading(true);
      const { count: sedesCount } = await supabase.from('sedes').select('*', { count: 'exact', head: true });
      const { count: barbersCount } = await supabase.from('barbeiros').select('*', { count: 'exact', head: true });
      const { count: servicesCount } = await supabase.from('servicos').select('*', { count: 'exact', head: true });

      const hasSedes = (sedesCount || 0) > 0;
      const hasBarbers = (barbersCount || 0) > 0;
      const hasServices = (servicesCount || 0) > 0;

      const currentSteps = [
        { isCompleted: hasSedes, title: "Crie sua Sede", description: "Cadastre a unidade principal da sua barbearia.", link: "/sedes" },
        { isCompleted: hasBarbers, title: "Cadastre um Barbeiro", description: "Adicione os profissionais da sua equipe.", link: "/barbeiros" },
        { isCompleted: hasServices, title: "Adicione um Serviço", description: "Defina os serviços que você oferece.", link: "/servicos" },
      ];
      
      setSteps(currentSteps);
      setAllCompleted(hasSedes && hasBarbers && hasServices);
      setLoading(false);
    };

    checkOnboardingStatus();
  }, []);

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
    )
  }

  if (allCompleted) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comece por aqui!</CardTitle>
        <CardDescription>Siga estes passos para configurar sua barbearia.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {steps.map((step, index) => (
            <li key={index} className="flex items-center gap-4">
              <div>
                {step.isCompleted ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${step.isCompleted ? 'text-muted-foreground line-through' : ''}`}>
                  {step.title}
                </p>
              </div>
              {!step.isCompleted && (
                <Button asChild variant="secondary" size="sm">
                  <Link to={step.link}>
                    Configurar <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default OnboardingProgress;