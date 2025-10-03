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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef } from "react";
import AvatarCropper from "../AvatarCropper";
import { UploadCloud, Trash2, Edit } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  commission_percentage: z.coerce.number().min(0, "A comissão não pode ser negativa.").max(100, "A comissão não pode ser maior que 100.").optional(),
  bio: z.string().optional(),
  specialty: z.string().optional(),
  experience_years: z.coerce.number().int().min(0, "Os anos de experiência não podem ser negativos.").optional(),
});

type Barber = {
  id: string;
  name: string;
  commission_percentage?: number;
  bio?: string | null;
  avatar_url?: string | null;
  specialty?: string | null;
  experience_years?: number | null;
};

type BarberFormProps = {
  onSuccess: () => void;
  barber?: Barber | null;
};

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

const BarberForm = ({ onSuccess, barber }: BarberFormProps) => {
  const { ownerId, selectedSede, user } = useSessionStore();
  const [imgSrc, setImgSrc] = useState('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: barber?.name || "",
      commission_percentage: barber?.commission_percentage || 0,
      bio: barber?.bio || "",
      specialty: barber?.specialty || "",
      experience_years: barber?.experience_years || 0,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setCropModalOpen(true);
      e.target.value = '';
    }
  };

  const handleEditClick = () => {
    if (barber?.avatar_url) {
      setImgSrc(`${barber.avatar_url}?t=${new Date().getTime()}`);
      setCropModalOpen(true);
    }
  };

  const handleCropComplete = async (blob: Blob) => {
    setCropModalOpen(false);
    if (!user || !barber) return;

    const toastId = showLoading("Enviando imagem...");
    const fileExt = 'png';
    const filePath = `${user.id}/${barber.id}/${new Date().getTime()}.${fileExt}`;
    const croppedFile = new File([blob], filePath, { type: 'image/png' });

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, croppedFile, { upsert: true });

    if (uploadError) {
      dismissToast(toastId);
      showError(`Erro no upload: ${uploadError.message}`);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const url = data.publicUrl;

    const { error: barberUpdateError } = await supabase.from("barbeiros").update({ avatar_url: url }).eq("id", barber.id);
    if (barberUpdateError) {
      dismissToast(toastId);
      showError("Erro ao salvar avatar do barbeiro.");
      return;
    }
    
    dismissToast(toastId);
    showSuccess("Avatar atualizado!");
    onSuccess();
  };

  const handleRemove = async () => {
    if (!barber) return;
    const toastId = showLoading("Removendo avatar...");
    const { error } = await supabase.from("barbeiros").update({ avatar_url: null }).eq("id", barber.id);
    if (error) {
      dismissToast(toastId);
      showError("Erro ao remover avatar.");
    } else {
      dismissToast(toastId);
      showSuccess("Avatar removido!");
      onSuccess();
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!ownerId || !selectedSede) {
      showError("Você precisa estar logado e ter uma sede selecionada.");
      return;
    }

    const toastId = showLoading(barber ? "Atualizando barbeiro..." : "Adicionando barbeiro...");

    const barberData = {
      ...values,
      user_id: ownerId,
      sede_id: selectedSede.id,
    };

    let error;
    if (barber) {
      const { error: updateError } = await supabase
        .from("barbeiros")
        .update(barberData)
        .eq("id", barber.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("barbeiros").insert([barberData]);
      error = insertError;
    }

    dismissToast(toastId);

    if (error) {
      showError(`Erro ao salvar barbeiro: ${error.message}`);
    } else {
      showSuccess(`Barbeiro ${barber ? 'atualizado' : 'adicionado'} com sucesso!`);
      form.reset();
      onSuccess();
    }
  }

  return (
    <>
      {cropModalOpen && imgSrc && (
        <AvatarCropper
          imgSrc={imgSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropModalOpen(false)}
        />
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Barbeiro</FormLabel>
              <FormControl><Input placeholder="Nome do profissional" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          {barber && (
            <div className="space-y-2">
              <FormLabel>Foto de Perfil</FormLabel>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 text-xl">
                  <AvatarImage src={barber.avatar_url || undefined} alt={barber.name} />
                  <AvatarFallback>{getInitials(barber.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Trocar Foto
                  </Button>
                  <Input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  {barber.avatar_url && (
                    <>
                      <Button type="button" onClick={handleEditClick} variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button type="button" onClick={handleRemove} variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          <FormField control={form.control} name="specialty" render={({ field }) => (
            <FormItem>
              <FormLabel>Especialidade (Opcional)</FormLabel>
              <FormControl><Input placeholder="Ex: Cortes Clássicos" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="commission_percentage" render={({ field }) => (
              <FormItem>
                  <FormLabel>Comissão (%)</FormLabel>
                  <FormControl><Input type="number" placeholder="Ex: 40" {...field} /></FormControl>
                  <FormMessage />
              </FormItem>
              )} />
              <FormField control={form.control} name="experience_years" render={({ field }) => (
              <FormItem>
                  <FormLabel>Anos de Exp.</FormLabel>
                  <FormControl><Input type="number" placeholder="Ex: 5" {...field} /></FormControl>
                  <FormMessage />
              </FormItem>
              )} />
          </div>
          <FormField control={form.control} name="bio" render={({ field }) => (
            <FormItem>
              <FormLabel>Biografia (Opcional)</FormLabel>
              <FormControl><Textarea placeholder="Um pouco sobre o profissional..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
            {form.formState.isSubmitting ? "Salvando..." : "Salvar Barbeiro"}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default BarberForm;