import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { MailCheck, Loader2, Eye, EyeOff } from "lucide-react";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";

const formSchema = z.object({
  full_name: z.string().min(3, { message: "O nome completo é obrigatório." }),
  phone: z.string().min(10, { message: "O telefone parece curto demais." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

const SignUpForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    setSubmittedEmail(values.email);

    // The logic to find ownerId and sedeId is now expected to be in a DB trigger.
    // We only pass the user-provided data.
    const { error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.full_name,
          phone: values.phone,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsSubmitting(false);
      return;
    }

    // The creation of the 'profiles' and 'clientes' records is now handled by a
    // 'handle_new_user' trigger in the Supabase database, which is more secure.
    setSuccess(true);
    setIsSubmitting(false);
  }

  const handleResendEmail = async () => {
    if (!submittedEmail) return;
    setIsResending(true);
    const toastId = showLoading("Reenviando email...");
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: submittedEmail,
    });
    dismissToast(toastId);
    if (error) {
        showError(`Erro ao reenviar: ${error.message}`);
    } else {
        showSuccess("Email de confirmação reenviado!");
    }
    setIsResending(false);
  };

  if (success) {
    return (
      <Alert>
        <MailCheck className="h-4 w-4" />
        <AlertTitle>Verifique seu email!</AlertTitle>
        <AlertDescription>
          Enviamos um link de confirmação para o seu email. Por favor, clique no link para ativar sua conta.
        </AlertDescription>
        <div className="mt-4">
            <Button onClick={handleResendEmail} disabled={isResending} variant="outline" size="sm">
                {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Não recebeu? Reenviar email
            </Button>
        </div>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        
        <FormField control={form.control} name="full_name" render={({ field }) => (
          <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Seu nome completo" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input placeholder="5511999999999" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>Senha</FormLabel>
            <FormControl>
                <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Criando conta..." : "Criar Conta"}
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;