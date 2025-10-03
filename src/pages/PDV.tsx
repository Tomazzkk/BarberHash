import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { PlusCircle, MinusCircle, Trash2, Package, Scissors, ShoppingCart, TicketPercent } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Promocao } from "@/components/forms/PromocaoForm";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ClientForm from "@/components/forms/ClientForm";
import SaleConfirmationDialog from "@/components/pdv/SaleConfirmationDialog";
import { useQueryClient } from "@tanstack/react-query";

type Product = { id: string; name: string; price: number; quantity: number; };
type Service = { id: string; name: string; price: number; };
type Client = { id: string; name: string; };
type Barber = { id: string; name: string; };

type CartItem = {
  id: string;
  name: string;
  type: 'product' | 'service';
  quantity: number;
  price: number;
  stock?: number;
};

const PDV = () => {
  const { user, selectedSede, ownerId } = useSessionStore();
  const queryClient = useQueryClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promotions, setPromotions] = useState<Promocao[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | undefined>(undefined);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);
  const [selectedBarberId, setSelectedBarberId] = useState<string | undefined>(undefined);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [saleCompletedDetails, setSaleCompletedDetails] = useState<any | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const fetchClients = async () => {
    if (!ownerId) return;
    const { data, error } = await supabase
        .from("clientes")
        .select("id, name")
        .eq("user_id", ownerId)
        .order("created_at", { ascending: false });
    if (error) {
        showError("Não foi possível carregar os clientes.");
    } else {
        setClients(data || []);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSede) {
        setProducts([]);
        setServices([]);
        setPromotions([]);
        setClients([]);
        setBarbers([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const now = new Date().toISOString();
      const [productRes, serviceRes, promoRes, barberRes] = await Promise.all([
        supabase.from("produtos").select("id, name, price, quantity").eq("sede_id", selectedSede.id),
        supabase.from("servicos").select("id, name, price").eq("sede_id", selectedSede.id),
        supabase.from("promocoes").select("*").eq("sede_id", selectedSede.id).eq("is_active", true).lte("start_date", now).gte("end_date", now),
        supabase.from("barbeiros").select("id, name").eq("sede_id", selectedSede.id),
      ]);
      await fetchClients();
      setProducts(productRes.data || []);
      setServices(serviceRes.data || []);
      setPromotions(promoRes.data || []);
      setBarbers(barberRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [selectedSede, ownerId]);

  const addToCart = (item: Product | Service, type: 'product' | 'service') => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      return [...prevCart, { ...item, type, quantity: 1, stock: (item as Product).quantity }];
    });
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const filteredItems = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(lowerSearchTerm));
    const filteredServices = services.filter(s => s.name.toLowerCase().includes(lowerSearchTerm));
    return { products: filteredProducts, services: filteredServices };
  }, [searchTerm, products, services]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const { discount, finalTotal, selectedPromotion } = useMemo(() => {
    if (!selectedPromotionId) {
        return { discount: 0, finalTotal: cartTotal, selectedPromotion: null };
    }
    const promotion = promotions.find(p => p.id === selectedPromotionId);
    if (!promotion) {
        return { discount: 0, finalTotal: cartTotal, selectedPromotion: null };
    }
    let discountAmount = 0;
    if (promotion.discount_type === 'percentage') {
        discountAmount = cartTotal * (promotion.discount_value / 100);
    } else {
        discountAmount = promotion.discount_value;
    }
    discountAmount = Math.min(cartTotal, discountAmount);
    return { discount: discountAmount, finalTotal: cartTotal - discountAmount, selectedPromotion: promotion };
  }, [cartTotal, selectedPromotionId, promotions]);

  const handleClientFormSuccess = async () => {
    setIsClientFormOpen(false);
    await fetchClients();
  };

  const handleFinalizeSale = async () => {
    if (!user || !selectedSede) {
      showError("Sessão expirada ou filial não selecionada. Faça login novamente.");
      return;
    }
    if (cart.length === 0) {
      showError("O carrinho está vazio.");
      return;
    }
    setIsSubmitting(true);
    const toastId = showLoading("Processando venda...");
    const saleItems = cart.map(item => ({ id: item.id, name: item.name, type: item.type, quantity: item.quantity, price: item.price }));
    const { error } = await supabase.rpc('process_sale', { 
        p_sale_items: saleItems, 
        p_sede_id: selectedSede.id, 
        p_cliente_id: selectedClientId || null, 
        p_discount_amount: discount, 
        p_promotion_name: selectedPromotion?.name || null,
        p_barbeiro_id: selectedBarberId || null
    });
    dismissToast(toastId);
    if (error) {
        showError(`Erro ao processar venda: ${error.message}`);
        setIsSubmitting(false);
    } else {
        queryClient.invalidateQueries({ queryKey: ['financial_entries'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        const saleDetails = {
            cart: cart,
            subtotal: cartTotal,
            discount: discount,
            total: finalTotal,
            clientName: clients.find(c => c.id === selectedClientId)?.name,
            barberName: barbers.find(b => b.id === selectedBarberId)?.name,
            promotionName: selectedPromotion?.name,
        };
        setSaleCompletedDetails(saleDetails);
        setIsConfirmationOpen(true);
    }
    setIsSubmitting(false);
  };

  const handleNewSale = () => {
    setIsConfirmationOpen(false);
    setSaleCompletedDetails(null);
    setCart([]);
    setSelectedPromotionId(undefined);
    setSelectedClientId(undefined);
    setSelectedBarberId(undefined);
    if (selectedSede) {
        supabase.from("produtos").select("id, name, price, quantity").eq("sede_id", selectedSede.id).then(res => setProducts(res.data || []));
    }
  };

  if (!selectedSede) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Card className="max-w-md"><CardHeader><CardTitle>Nenhuma Sede Selecionada</CardTitle><CardDescription>Para usar o Ponto de Venda, você precisa primeiro selecionar uma sede.</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">Use o seletor no menu lateral.</p></CardContent></Card>
        </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
        <Card className="lg:col-span-2 flex flex-col"><CardHeader><CardTitle>Ponto de Venda: {selectedSede.name}</CardTitle><Input placeholder="Buscar produtos ou serviços..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></CardHeader>
          <CardContent className="flex-grow overflow-hidden"><ScrollArea className="h-full">{loading ? (<div className="space-y-4 pr-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>) : (<div className="space-y-4 pr-4"><h3 className="font-semibold text-lg flex items-center gap-2"><Scissors /> Serviços</h3>{filteredItems.services.map(service => (<div key={service.id} className="flex items-center justify-between p-2 border rounded-lg"><div><p className="font-medium">{service.name}</p><p className="text-sm text-muted-foreground">R$ {service.price.toFixed(2)}</p></div><Button size="sm" onClick={() => addToCart(service, 'service')}>Adicionar</Button></div>))}<Separator className="my-6" /><h3 className="font-semibold text-lg flex items-center gap-2"><Package /> Produtos</h3>{filteredItems.products.map(product => (<div key={product.id} className="flex items-center justify-between p-2 border rounded-lg"><div><p className="font-medium">{product.name}</p><p className="text-sm text-muted-foreground">R$ {product.price.toFixed(2)} • {product.quantity} em estoque</p></div><Button size="sm" onClick={() => addToCart(product, 'product')} disabled={product.quantity <= 0}>{product.quantity <= 0 ? "Esgotado" : "Adicionar"}</Button></div>))}</div>)}</ScrollArea></CardContent>
        </Card>
        <Card className="flex flex-col"><CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart /> Resumo da Venda</CardTitle></CardHeader>
          <CardContent className="flex-grow flex flex-col justify-between"><ScrollArea className="h-64">{cart.length === 0 ? (<p className="text-center text-muted-foreground py-10">Carrinho vazio</p>) : (<div className="space-y-4">{cart.map(item => (<div key={item.id} className="flex items-start justify-between"><div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">R$ {item.price.toFixed(2)}</p><div className="flex items-center gap-2 mt-1"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}><MinusCircle className="h-4 w-4" /></Button><span>{item.quantity}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}><PlusCircle className="h-4 w-4" /></Button></div></div><div className="text-right"><p className="font-semibold">R$ {(item.price * item.quantity).toFixed(2)}</p><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.id)}><Trash2 className="h-4 w-4" /></Button></div></div>))}</div>)}</ScrollArea>
            <div className="mt-auto pt-4 border-t space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="barber-select">Barbeiro (Opcional)</Label>
                  <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
                      <SelectTrigger id="barber-select"><SelectValue placeholder="Selecione o barbeiro" /></SelectTrigger>
                      <SelectContent>
                          {barbers.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="client-select">Cliente (Opcional)</Label>
                  <Select value={selectedClientId || 'none'} onValueChange={(value) => {
                      if (value === 'add_new') {
                          setIsClientFormOpen(true);
                      } else {
                          setSelectedClientId(value === 'none' ? undefined : value);
                      }
                  }}>
                      <SelectTrigger id="client-select"><SelectValue placeholder="Venda anônima" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="add_new" className="font-semibold text-primary">
                              <div className="flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Criar Novo Cliente</div>
                          </SelectItem>
                          <SelectItem value="none">Venda anônima</SelectItem>
                          {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="promotion-select">Aplicar Promoção</Label>
                  <Select value={selectedPromotionId || ''} onValueChange={(value) => setSelectedPromotionId(value || undefined)} disabled={promotions.length === 0 || cart.length === 0}><SelectTrigger id="promotion-select"><SelectValue placeholder="Nenhuma promoção" /></SelectTrigger><SelectContent>{promotions.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent></Select>
              </div>
              <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>R$ {cartTotal.toFixed(2)}</span></div>
                  {discount > 0 && (<div className="flex justify-between text-destructive"><span>Desconto ({selectedPromotion?.name})</span><span>- R$ {discount.toFixed(2)}</span></div>)}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg"><span>Total</span><span>R$ {finalTotal.toFixed(2)}</span></div>
              </div>
              <Button className="w-full" size="lg" onClick={handleFinalizeSale} disabled={isSubmitting || cart.length === 0}>{isSubmitting ? "Finalizando..." : "Finalizar Venda"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={isClientFormOpen} onOpenChange={setIsClientFormOpen}>
          <DialogContent><DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>{selectedSede && <ClientForm onSuccess={handleClientFormSuccess} />}</DialogContent>
      </Dialog>
      <SaleConfirmationDialog 
        isOpen={isConfirmationOpen}
        onClose={handleNewSale}
        saleDetails={saleCompletedDetails}
      />
    </>
  );
};

export default PDV;