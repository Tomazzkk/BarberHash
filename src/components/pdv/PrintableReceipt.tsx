import React from 'react';
import { useSessionStore } from '@/hooks/useSessionStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Logo from '../Logo';

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

type PrintableReceiptProps = {
  saleDetails: SaleDetails;
};

const PrintableReceipt = React.forwardRef<HTMLDivElement, PrintableReceiptProps>(({ saleDetails }, ref) => {
  const { selectedSede, config } = useSessionStore();

  return (
    <div ref={ref} className="p-4 font-mono text-xs text-black bg-white">
      <div className="text-center mb-4">
        {config?.logo_url ? (
          <img src={config.logo_url} alt="Logo" className="h-12 w-auto mx-auto" />
        ) : (
          <div className="text-2xl font-bold"><Logo /></div>
        )}
        <p className="text-sm font-semibold mt-2">{selectedSede?.name}</p>
        <p>{selectedSede?.address}</p>
        <p>{format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
      </div>
      <div className="mb-2">
        <p><strong>Cliente:</strong> {saleDetails.clientName || 'Não identificado'}</p>
        <p><strong>Profissional:</strong> {saleDetails.barberName || 'Não identificado'}</p>
      </div>
      <hr className="border-dashed border-black my-2" />
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">Item</th>
            <th className="text-center">Qtd</th>
            <th className="text-right">Preço</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {saleDetails.cart.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-right">{item.price.toFixed(2)}</td>
              <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="border-dashed border-black my-2" />
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>R$ {saleDetails.subtotal.toFixed(2)}</span>
        </div>
        {saleDetails.discount > 0 && (
          <div className="flex justify-between">
            <span>Desconto ({saleDetails.promotionName || 'Promoção'}):</span>
            <span>- R$ {saleDetails.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL:</span>
          <span>R$ {saleDetails.total.toFixed(2)}</span>
        </div>
      </div>
      <p className="text-center mt-4">Obrigado pela preferência!</p>
    </div>
  );
});

export default PrintableReceipt;