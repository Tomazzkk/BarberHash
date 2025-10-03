import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import ImageUploader from "@/components/ImageUploader";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Home } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome da sede é obrigatório." }),
  address: z.string().optional(),
  phone: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  image_url: z.string().url().optional().nullable(),
});

export type Sede = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
};

type SedeFormProps = {
  onSuccess: () => void;
  sede?: Sede | null;
};

const SedeForm = ({ onSuccess, sede }: SedeFormProps) => {
  const user = useSessionStore((state) => state.user);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: sede?.name || "",
      address: sede?.address || "",
      phone: sede?.phone || "",
      latitude: sede?.latitude || undefined,
      longitude: sede?.longitude || undefined,
      image_url: sede?.image_url || null,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado.");
      return;
    }

    const toastId = showLoading(sede ? "Atualizando sede..." : "Adicionando sede...");

    const sedeData = {
      ...values,
      user_id: user.id,
    };

    let error;
    if (sede) {
      const { error: updateError } = await supabase
        .from("sedes")
        .update(sedeData)
        .eq("id", sede.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("sedes").insert([sedeData]);
      error = insertError;
    }

    dismissToast(toastId);

    if (error) {
      showError(`Erro ao salvar sede: ${error.message}`);
    } else {
      showSuccess(`Sede ${sede ? 'atualizada' : 'adicionada'} com sucesso!`);
      form.reset();
      onSuccess();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {sede && (
          <div className="space-y-2">
            <FormLabel>Imagem da Sede</FormLabel>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 text-xl rounded-md">
                <AvatarImage src={form.watch('image_url') || undefined} alt={sede.name} />
                <AvatarFallback className="rounded-md">
                  <Home />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <ImageUploader
                  bucketName="sede-images"
                  filePath={`${user?.id}/${sede.id}`}
                  currentUrl={form.watch('image_url')}
                  onUpload={(url) => form.setValue('image_url', url, { shouldDirty: true })}
                  onRemove={() => form.setValue('image_url', null, { shouldDirty: true })}
                />
              </div>
            </div>
          </div>
        )}
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nome da Sede</FormLabel>
            <FormControl><Input placeholder="Ex: Matriz Centro" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem>
            <FormLabel>Endereço (Opcional)</FormLabel>
            <FormControl><Input placeholder="Rua Exemplo, 123" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Telefone (Opcional)</FormLabel>
            <FormControl><Input placeholder="(99) 99999-9999" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="latitude" render={({ field }) => (
            <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl><Input type="number" step="any" placeholder="-23.550520" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
            <FormField control={form.control} name="longitude" render={({ field }) => (
            <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl><Input type="number" step="any" placeholder="-46.633308" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
        </div>
        <FormDescription>
            Para encontrar as coordenadas, clique com o botão direito no local no Google Maps. O primeiro número é a latitude, o segundo é a longitude.
        </FormDescription>
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Sede"}
        </Button>
      </form>
    </Form>
  );
};

export default SedeForm;