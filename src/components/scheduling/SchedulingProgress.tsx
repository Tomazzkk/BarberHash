import { Progress } from "@/components/ui/progress";

type SchedulingProgressProps = {
  currentStep: number;
  totalSteps: number;
};

const SchedulingProgress = ({ currentStep, totalSteps }: SchedulingProgressProps) => {
  if (currentStep > totalSteps) return null;
  const progressValue = (currentStep / totalSteps) * 100;
  return (
    <div className="animate-fade-in">
      <p className="text-center text-sm font-medium text-muted-foreground mb-2">
        Passo {currentStep} de {totalSteps}
      </p>
      <Progress value={progressValue} className="w-full" />
    </div>
  );
};

export default SchedulingProgress;