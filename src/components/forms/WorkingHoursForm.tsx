import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Switch } from "@/components/ui/switch";
import { Trash2, PlusCircle } from "lucide-react";
import { Separator } from "../ui/separator";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const breakSchema = z.object({
  start: z.string(),
  end: z.string(),
});

const daySchema = z.object({
  active: z.boolean(),
  start: z.string(),
  end: z.string(),
  breaks: z.array(breakSchema),
});

const formSchema = z.object({
  monday: daySchema,
  tuesday: daySchema,
  wednesday: daySchema,
  thursday: daySchema,
  friday: daySchema,
  saturday: daySchema,
  sunday: daySchema,
});

type WorkingHours = z.infer<typeof formSchema>;

type Barber = {
  id: string;
  name: string;
  working_hours?: WorkingHours | null;
};

type WorkingHoursFormProps = {
  onSuccess: () => void;
  barber: Barber;
};

const weekDays = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
};

const defaultWeekdayValue = { active: true, start: "09:00", end: "20:00", breaks: [{ start: "12:00", end: "13:00" }] };
const defaultSaturdayValue = { active: true, start: "09:00", end: "18:00", breaks: [{ start: "12:00", end: "13:00" }] };
const defaultSundayValue = { active: false, start: "09:00", end: "18:00", breaks: [] };

const WorkingHoursForm = ({ onSuccess, barber }: WorkingHoursFormProps) => {
  const [useSameHoursForWeekdays, setUseSameHoursForWeekdays] = useState(true);

  const form = useForm<WorkingHours>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      monday: { ...defaultWeekdayValue, ...barber.working_hours?.monday },
      tuesday: { ...defaultWeekdayValue, ...barber.working_hours?.tuesday },
      wednesday: { ...defaultWeekdayValue, ...barber.working_hours?.wednesday },
      thursday: { ...defaultWeekdayValue, ...barber.working_hours?.thursday },
      friday: { ...defaultWeekdayValue, ...barber.working_hours?.friday },
      saturday: { ...defaultSaturdayValue, ...barber.working_hours?.saturday },
      sunday: { ...defaultSundayValue, ...barber.working_hours?.sunday },
    },
  });

  async function onSubmit(values: WorkingHours) {
    const toastId = showLoading("Salvando horários...");

    const finalValues = { ...values };
    if (useSameHoursForWeekdays) {
      const mondayHours = values.monday;
      finalValues.tuesday = mondayHours;
      finalValues.wednesday = mondayHours;
      finalValues.thursday = mondayHours;
      finalValues.friday = mondayHours;
    }

    const { error } = await supabase
      .from("barbeiros")
      .update({ working_hours: finalValues })
      .eq("id", barber.id);

    dismissToast(toastId);

    if (error) {
      showError(`Erro ao salvar horários: ${error.message}`);
    } else {
      showSuccess(`Horários de ${barber.name} atualizados!`);
      onSuccess();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
          <Card>
            <CardHeader>
              <CardTitle>Dias de Semana</CardTitle>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="same-hours-weekday"
                  checked={useSameHoursForWeekdays}
                  onCheckedChange={setUseSameHoursForWeekdays}
                />
                <Label htmlFor="same-hours-weekday">Usar os mesmos horários para Segunda a Sexta</Label>
              </div>
            </CardHeader>
            <CardContent>
              {useSameHoursForWeekdays ? (
                <DayField day="monday" control={form.control} label="Segunda a Sexta" />
              ) : (
                <Tabs defaultValue="monday" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="monday">Seg</TabsTrigger>
                    <TabsTrigger value="tuesday">Ter</TabsTrigger>
                    <TabsTrigger value="wednesday">Qua</TabsTrigger>
                    <TabsTrigger value="thursday">Qui</TabsTrigger>
                    <TabsTrigger value="friday">Sex</TabsTrigger>
                  </TabsList>
                  <TabsContent value="monday" className="mt-4"><DayField day="monday" control={form.control} /></TabsContent>
                  <TabsContent value="tuesday" className="mt-4"><DayField day="tuesday" control={form.control} /></TabsContent>
                  <TabsContent value="wednesday" className="mt-4"><DayField day="wednesday" control={form.control} /></TabsContent>
                  <TabsContent value="thursday" className="mt-4"><DayField day="thursday" control={form.control} /></TabsContent>
                  <TabsContent value="friday" className="mt-4"><DayField day="friday" control={form.control} /></TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
          <DayField day="saturday" control={form.control} />
          <DayField day="sunday" control={form.control} />
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Horários"}
        </Button>
      </form>
    </Form>
  );
};

const DayField = ({ day, control, label }: { day: keyof WorkingHours, control: any, label?: string }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `${day}.breaks`,
    });

    const isActive = useWatch({ control, name: `${day}.active` });

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-background">
            <div className="flex items-center justify-between">
                <FormLabel className="text-lg font-semibold">{label || weekDays[day]}</FormLabel>
                <FormField control={control} name={`${day}.active`} render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                        <FormLabel>{field.value ? "Aberto" : "Fechado"}</FormLabel>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />
            </div>
            {isActive && (
                <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={control} name={`${day}.start`} render={({ field }) => (
                            <FormItem><FormLabel>Início</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={control} name={`${day}.end`} render={({ field }) => (
                            <FormItem><FormLabel>Fim</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <div>
                        <FormLabel>Pausas</FormLabel>
                        <div className="space-y-2 mt-2">
                            {fields.map((item, index) => (
                                <div key={item.id} className="flex items-center gap-2">
                                    <FormField control={control} name={`${day}.breaks.${index}.start`} render={({ field }) => (
                                        <FormItem className="flex-1"><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                                    )} />
                                    <span className="text-muted-foreground">-</span>
                                    <FormField control={control} name={`${day}.breaks.${index}.end`} render={({ field }) => (
                                        <FormItem className="flex-1"><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                                    )} />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ start: "12:00", end: "13:00" })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Pausa
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default WorkingHoursForm;