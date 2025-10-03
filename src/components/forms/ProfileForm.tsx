import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef } from "react";
import AvatarCropper from "../AvatarCropper";
import { UploadCloud, Trash2 } from "lucide-react";

const formSchema = z.object({
  full_name: z.string().min(3, { message: "O nome completo é obrigatório." }),
});

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

const ProfileForm = () => {
  const { user, profile, fetchSessionData, session } = useSessionStore();
  const [imgSrc, setImgSrc] = useState('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setCropModalOpen(true);
    }
  };

  const handleCropComplete = async (blob: Blob) => {
    setCropModalOpen(false);
    if (!user || !profile) return;

    const toastId = showLoading("Enviando imagem...");
    const fileExt = 'png';
    const filePath = `${user.id}/${new Date().getTime()}.${fileExt}`;
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

    const { error: profileError } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    if (profileError) {
      dismissToast(toastId);
      showError("Erro ao salvar avatar no perfil.");
      return;
    }
    
    dismissToast(toastId);
    showSuccess("Avatar atualizado!");
    fetchSessionData(session);
  };

  const handleRemove = async () => {
    if (!user || !profile) return;
    const toastId = showLoading("Removendo avatar...");

    const { error: profileError } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    if (profileError) {
      dismissToast(toastId);
      showError("Erro ao remover avatar do perfil.");
      return;
    }

    dismissToast(toastId);
    showSuccess("Avatar removido!");
    fetchSessionData(session);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    const toastId = showLoading("Atualizando perfil...");

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: values.full_name })
      .eq("id", user.id);

    dismissToast(toastId);
    if (error) {
      showError(`Erro: ${error.message}`);
    } else {
      showSuccess("Perfil atualizado!");
      fetchSessionData(session);
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-2">
              <FormLabel>Foto de Perfil</FormLabel>
              <Avatar className="w-24 h-24 text-3xl">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Avatar'} />
                <AvatarFallback>{getInitials(profile?.full_name || user?.email || 'U')}</AvatarFallback>
              </Avatar>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Trocar Foto
                </Button>
                <Input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                {profile?.avatar_url && (
                  <Button type="button" onClick={handleRemove} variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover
                  </Button>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl><Input placeholder="Seu nome completo" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default ProfileForm;