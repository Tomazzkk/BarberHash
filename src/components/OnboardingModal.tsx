import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, Circle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

type OnboardingStep = {
  isCompleted: boolean;
  title: string;
  description: string;
  link: string;
};

type OnboardingModalProps = {
  steps: OnboardingStep[];
  isOpen: boolean;
  onClose: () => void;
};

const OnboardingModal = ({ steps, isOpen, onClose }: OnboardingModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Bem-vindo ao BarberPro!</DialogTitle>
          <DialogDescription>
            Siga estes passos para configurar sua barbearia e começar a agendar.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-4 py-4">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-4">
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
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              {!step.isCompleted && (
                <Button asChild variant="outline" size="sm" onClick={onClose}>
                  <Link to={step.link}>
                    Começar <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
        <DialogFooter>
            <Button variant="ghost" onClick={onClose}>Fazer isso depois</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;