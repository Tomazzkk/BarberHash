import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import ImageUploader from "@/components/ImageUploader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Package } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome do produto é obrigatório." }),
  brand: z.string().optional(),
  description: z.string().optional(),
  quantity: z.coerce.number().int().min(0, { message: "A quantidade não pode ser negativa." }),
  min_quantity: z.coerce.number().int().min(0, { message: "A quantidade mínima não pode ser negativa." }).optional(),
  price: z.coerce.number().positive({ message: "O preço de venda deve ser positivo." }),
  cost: z.coerce.number().min(0, { message: "O custo não pode ser negativo." }).optional(),
  image_url: z.string().url().optional().nullable(),
});

export type Product = {
  id: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  quantity: number;
  min_quantity?: number | null;
  price: number;
  cost?: number | null;
  image_url?: string | null;
  is_featured?: boolean;
};

type ProductFormProps = {
  onSuccess: () => void;
  product?: Product | null;
};

const ProductForm = ({ onSuccess, product }: ProductFormProps) => {
  const { ownerId, selectedSede } = useSessionStore();
  const [tempId] = useState(() => crypto.randomUUID());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || "",
      brand: product?.brand || "",
      description: product?.description || "",
      quantity: product?.quantity || 0,
      min_quantity: product?.min_quantity || 0,
      price: product?.price || 0,
      cost: product?.cost || 0,
      image_url: product?.image_url || null,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!ownerId || !selectedSede) {
      showError("Você precisa estar logado e ter uma sede selecionada.");
      return;
    }

    const toastId = showLoading(product ? "Atualizando produto..." : "Adicionando produto...");

    const productData = {
      ...values,
      user_id: ownerId,
      sede_id: selectedSede.id,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (product) {
      const { error: updateError } = await supabase
        .from("produtos")
        .update(productData)
        .eq("id", product.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("produtos").insert([productData]);
      error = insertError;
    }

    dismissToast(toastId);

    if (error) {
      showError(`Erro ao salvar produto: ${error.message}`);
    } else {
      showSuccess(`Produto ${product ? 'atualizado' : 'adicionado'} com sucesso!`);
      form.reset();
      onSuccess();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <div className="space-y-2">
            <FormLabel>Imagem do Produto</FormLabel>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 text-xl rounded-md">
                <AvatarImage src={form.watch('image_url') || undefined} alt={form.watch('name')} />
                <AvatarFallback className="rounded-md">
                  <Package />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <ImageUploader
                  bucketName="product-images"
                  filePath={`${ownerId}/${product?.id || tempId}`}
                  currentUrl={form.watch('image_url')}
                  onUpload={(url) => form.setValue('image_url', url, { shouldDirty: true })}
                  onRemove={() => form.setValue('image_url', null, { shouldDirty: true })}
                />
              </div>
            </div>
        </div>
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do Produto</FormLabel>
            <FormControl><Input placeholder="Ex: Pomada Modeladora" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="brand" render={({ field }) => (
          <FormItem>
            <FormLabel>Marca (Opcional)</FormLabel>
            <FormControl><Input placeholder="Ex: BarberPro Co." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="quantity" render={({ field }) => (
            <FormItem>
                <FormLabel>Quantidade em Estoque</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
            <FormField control={form.control} name="min_quantity" render={({ field }) => (
            <FormItem>
                <FormLabel>Estoque Mínimo</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem>
                <FormLabel>Preço de Venda (R$)</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
            <FormField control={form.control} name="cost" render={({ field }) => (
            <FormItem>
                <FormLabel>Custo (R$, Opcional)</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
        </div>
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição (Opcional)</FormLabel>
            <FormControl><Textarea placeholder="Detalhes do produto, para quem se destina, etc." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Produto"}
        </Button>
      </form>
    </Form>
  );
};

export default ProductForm;