import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { StarRating } from "@/components/ui/star-rating";

const formSchema = z.object({
  rating: z.number().min(1, "A avaliação é obrigatória.").max(5),
  comment: z.string().optional(),
});

type ReviewFormProps = {
  appointmentId: string;
  barberId: string;
  clientId: string;
  ownerId: string;
  sedeId: string;
  onSuccess: () => void;
};

const ReviewForm = ({ appointmentId, barberId, clientId, ownerId, sedeId, onSuccess }: ReviewFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const toastId = showLoading("Enviando sua avaliação...");

    const reviewData = {
      ...values,
      agendamento_id: appointmentId,
      barbeiro_id: barberId,
      cliente_id: clientId,
      user_id: ownerId,
      sede_id: sedeId,
    };

    const { error } = await supabase.from("avaliacoes").insert([reviewData]);

    dismissToast(toastId);

    if (error) {
      showError(`Erro ao enviar avaliação: ${error.message}`);
    } else {
      showSuccess("Avaliação enviada com sucesso! Obrigado.");
      form.reset();
      onSuccess();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center">
              <FormLabel className="mb-2 text-lg">Sua nota</FormLabel>
              <FormControl>
                <StarRating value={field.value} onChange={field.onChange} size={36} />
              </FormControl>
              <FormMessage className="mt-2" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deixe um comentário (opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Como foi sua experiência?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? "Enviando..." : "Enviar Avaliação"}
        </Button>
      </form>
    </Form>
  );
};

export default ReviewForm;