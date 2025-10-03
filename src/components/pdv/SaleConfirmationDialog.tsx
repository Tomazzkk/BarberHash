import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, CheckCircle } from "lucide-react";
import PrintableReceipt from './PrintableReceipt';
import { useReactToPrint } from 'react-to-print';

type CartItem = {
  name: string;
  quantity: number;
  price: number;
};

type SaleDetails = {
  cart: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  clientName?: string;
  barberName?: string;
  promotionName?: string;
};

type SaleConfirmationDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  saleDetails: SaleDetails | null;
};

const SaleConfirmationDialog: React.FC<SaleConfirmationDialogProps> = ({ isOpen, onClose, saleDetails }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `recibo-venda-${Date.now()}`,
  });

  if (!saleDetails) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Venda Finalizada com Sucesso!
            </DialogTitle>
            <DialogDescription>
              A venda foi registrada no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm">
            {saleDetails.cart.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Pago:</span>
              <span>R$ {saleDetails.total.toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter className="sm:justify-between gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Recibo
            </Button>
            <Button onClick={onClose}>
              Nova Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="hidden">
        <PrintableReceipt ref={receiptRef} saleDetails={saleDetails} />
      </div>
    </>
  );
};

export default SaleConfirmationDialog;