import { Award, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type LoyaltyProgressCardProps = {
  loyaltyProgress: {
    current_count: number;
    target_count: number;
    reward_service_name: string | null;
  };
  completedCount: number;
  loyaltyLevel: string;
  levelProgress: number;
  nextLevelCount: number;
};

const LoyaltyProgressCard = ({ loyaltyProgress, completedCount, loyaltyLevel, levelProgress, nextLevelCount }: LoyaltyProgressCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Award className="text-primary"/> Programa de Fidelidade</div>
          <Badge variant="secondary" className="flex items-center gap-1"><Trophy className="h-4 w-4 text-amber-500" />Nível {loyaltyLevel}</Badge>
        </CardTitle>
        <CardDescription>{completedCount} agendamentos concluídos até agora.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border-2 border-dashed rounded-lg bg-card">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-primary">Próxima Recompensa</h3>
            <p className="text-sm text-muted-foreground">
              {loyaltyProgress.reward_service_name ? `Ganhe: ${loyaltyProgress.reward_service_name}` : "Complete para ganhar um prêmio!"}
            </p>
          </div>
          <Progress value={(loyaltyProgress.current_count / loyaltyProgress.target_count) * 100} className="w-full" />
          <p className="text-center text-sm font-semibold mt-2">
            {loyaltyProgress.current_count} / {loyaltyProgress.target_count}
          </p>
        </div>
        {loyaltyLevel !== "Ouro" && (
          <div>
            <div className="flex justify-between items-center mb-1 text-sm">
              <p className="font-medium">Progresso para Nível {loyaltyLevel === 'Bronze' ? 'Prata' : 'Ouro'}</p>
              <p className="text-muted-foreground">{completedCount} / {nextLevelCount}</p>
            </div>
            <Progress value={levelProgress} className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoyaltyProgressCard;