import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Rocket } from "lucide-react";

type WhatsNewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  latestChanges: { version: string; date: string; changes: string[] };
};

const WhatsNewModal = ({ isOpen, onClose, latestChanges }: WhatsNewModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            O que há de novo na versão {latestChanges.version}
          </DialogTitle>
          <DialogDescription>
            Confira as últimas melhorias que preparamos para você.
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-2 pl-5 py-4 text-sm">
          {latestChanges.changes.map((change, index) => (
            <li key={index}>{change}</li>
          ))}
        </ul>
        <DialogFooter>
          <Button onClick={onClose}>Entendi!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsNewModal;