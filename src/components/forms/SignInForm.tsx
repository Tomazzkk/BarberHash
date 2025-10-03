import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, MailCheck } from "lucide-react";
import { showError } from "@/utils/toast";

const signInSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Por favor, insira um email válido." }),
});

const SignInForm = () => {
  const [view, setView] = useState<'sign_in' | 'forgot_password' | 'forgot_password_success'>('sign_in');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSignIn(values: z.infer<typeof signInSchema>) {
    setIsSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Email ou senha inválidos.' : error.message);
    }
    setIsSubmitting(false);
  }

  async function onForgotPassword(values: z.infer<typeof forgotPasswordSchema>) {
    setIsSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/`,
    });
    if (error) {
        showError(error.message);
    } else {
        setView('forgot_password_success');
    }
    setIsSubmitting(false);
  }

  if (view === 'forgot_password_success') {
    return (
        <Alert>
            <MailCheck className="h-4 w-4" />
            <AlertDescription>
                Se o email estiver correto, enviamos um link para redefinir sua senha.
            </AlertDescription>
            <Button variant="link" onClick={() => setView('sign_in')} className="p-0 h-auto mt-2">Voltar para o login</Button>
        </Alert>
    );
  }

  if (view === 'forgot_password') {
    return (
        <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-4">
                <p className="text-sm text-muted-foreground">Digite seu email para receber as instruções de redefinição de senha.</p>
                <FormField control={forgotPasswordForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Instruções
                </Button>
                <Button variant="link" onClick={() => setView('sign_in')} className="p-0 h-auto w-full">Voltar para o login</Button>
            </form>
        </Form>
    );
  }

  return (
    <Form {...signInForm}>
      <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <FormField control={signInForm.control} name="email" render={({ field }) => (
          <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={signInForm.control} name="password" render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
                <FormLabel>Senha</FormLabel>
                <Button type="button" variant="link" onClick={() => setView('forgot_password')} className="p-0 h-auto text-sm">Esqueceu a senha?</Button>
            </div>
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
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </Form>
  );
};

export default SignInForm;