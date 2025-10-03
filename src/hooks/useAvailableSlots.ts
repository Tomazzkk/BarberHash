import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, getDay, startOfDay, endOfDay } from "date-fns";

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

type WorkingHours = {
    [key in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']?: {
        active: boolean;
        start: string;
        end: string;
        breaks: { start: string; end: string }[];
    }
}

const dayMap: (keyof WorkingHours)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const useAvailableSlots = (selectedDate: Date | undefined, barberId?: string, serviceId?: string) => {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAndGenerateSlots = async () => {
      if (!selectedDate || !barberId || !serviceId) {
        setAvailableSlots([]);
        return;
      }

      setLoading(true);

      try {
        const dayKey = dayMap[getDay(selectedDate)];

        const [barberRes, serviceRes, appointmentsRes] = await Promise.all([
          supabase.from("barbeiros").select("working_hours").eq("id", barberId).single(),
          supabase.from("servicos").select("duration_minutes").eq("id", serviceId).single(),
          supabase.from("agendamentos")
            .select("start_time, end_time")
            .eq("barbeiro_id", barberId)
            .gte("start_time", startOfDay(selectedDate).toISOString())
            .lte("end_time", endOfDay(selectedDate).toISOString())
            .in('status', ['confirmado', 'concluido'])
        ]);

        const workingHours = barberRes.data?.working_hours as WorkingHours | null;
        const dayConfig = workingHours?.[dayKey];
        const serviceDuration = serviceRes.data?.duration_minutes;

        if (!dayConfig || !dayConfig.active || !serviceDuration) {
          setAvailableSlots([]);
          setLoading(false);
          return;
        }

        const workStart = timeToMinutes(dayConfig.start);
        const workEnd = timeToMinutes(dayConfig.end);
        const step = 5; // Check for a new slot every 5 minutes for more granularity

        const busyIntervals = [
          ...(dayConfig.breaks?.map(b => ({
            start: timeToMinutes(b.start),
            end: timeToMinutes(b.end),
          })) || []),
          ...(appointmentsRes.data?.map(a => ({
            start: timeToMinutes(format(new Date(a.start_time), "HH:mm")),
            end: timeToMinutes(format(new Date(a.end_time), "HH:mm")),
          })) || []),
        ];

        const slots: string[] = [];
        for (let slotStart = workStart; slotStart + serviceDuration <= workEnd; slotStart += step) {
          const slotEnd = slotStart + serviceDuration;
          const isOverlapping = busyIntervals.some(
            busy => slotStart < busy.end && slotEnd > busy.start
          );

          if (!isOverlapping) {
            slots.push(minutesToTime(slotStart));
          }
        }
        setAvailableSlots(slots);
      } catch (error) {
        console.error("Error generating slots:", error);
        setAvailableSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAndGenerateSlots();
  }, [selectedDate, barberId, serviceId]);

  return { availableSlots, loadingSlots: loading };
};