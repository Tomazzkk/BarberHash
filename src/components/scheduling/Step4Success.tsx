import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Calendar, User, Scissors, DollarSign } from 'lucide-react';

type Step4SuccessProps = {
  details: any;
  onFinish: () => void;
};

const Step4Success = ({ details, onFinish }: Step4SuccessProps) => {
    return (
        <div className="text-center flex flex-col items-center space-y-6 animate-fade-in">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h2 className="text-3xl font-bold">Agendamento Confirmado!</h2>
            <p className="text-muted-foreground max-w-md">
                Seu horário está garantido. Enviamos uma confirmação para o seu email e você pode ver os detalhes abaixo.
            </p>
            <Card className="w-full max-w-md text-left">
                <CardHeader><CardTitle>Detalhes do Agendamento</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-primary" /><div><p className="font-semibold">{format(details.date, "EEEE, dd 'de' MMMM", { locale: ptBR })} às {details.time}</p></div></div>
                    <div className="flex items-center gap-3"><User className="h-5 w-5 text-primary" /><div><p className="font-semibold">{details.barber.name}</p></div></div>
                    <div className="flex items-start gap-3"><Scissors className="h-5 w-5 text-primary mt-1" /><div><p className="font-semibold">Serviços</p><ul className="list-disc pl-5 text-muted-foreground">{details.services.map((s: any) => <li key={s.id}>{s.name}</li>)}</ul></div></div>
                    <div className="flex items-center gap-3"><DollarSign className="h-5 w-5 text-primary" /><div><p className="font-semibold">R$ {details.totalCost.toFixed(2)}</p></div></div>
                </CardContent>
            </Card>
            <Button size="lg" onClick={onFinish} className="w-full max-w-md">
                Ver Meus Agendamentos
            </Button>
        </div>
    );
};

export default Step4Success;