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

export const useSchedulingSlots = (selectedDate: Date | undefined, barberId?: string, totalDuration?: number) => {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAndGenerateSlots = async () => {
      if (!selectedDate || !barberId || !totalDuration) {
        setAvailableSlots([]);
        return;
      }

      setLoading(true);

      // Handle mock barbers to allow testing without real data
      if (barberId.startsWith('mock-')) {
        const mockSlots = [];
        // Generate slots from 9:00 to 17:30 every 30 minutes
        for (let i = 9 * 60; i <= 17 * 60; i += 30) {
            const hours = Math.floor(i / 60);
            const minutes = i % 60;
            mockSlots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
        }
        // Simulate a small delay
        setTimeout(() => {
            setAvailableSlots(mockSlots);
            setLoading(false);
        }, 300);
        return;
      }

      try {
        const dayKey = dayMap[getDay(selectedDate)];

        const [barberRes, appointmentsRes] = await Promise.all([
          supabase.from("barbeiros").select("working_hours").eq("id", barberId).single(),
          supabase.from("agendamentos")
            .select("start_time, end_time")
            .eq("barbeiro_id", barberId)
            .gte("start_time", startOfDay(selectedDate).toISOString())
            .lte("end_time", endOfDay(selectedDate).toISOString())
            .in('status', ['confirmado', 'concluido'])
        ]);

        const workingHours = barberRes.data?.working_hours as WorkingHours | null;
        const dayConfig = workingHours?.[dayKey];

        if (!dayConfig || !dayConfig.active) {
          setAvailableSlots([]);
          setLoading(false);
          return;
        }

        const workStart = timeToMinutes(dayConfig.start);
        const workEnd = timeToMinutes(dayConfig.end);
        const step = 30; // Check for a new slot every 30 minutes

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
        for (let slotStart = workStart; slotStart + totalDuration <= workEnd; slotStart += step) {
          const slotEnd = slotStart + totalDuration;
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
  }, [selectedDate, barberId, totalDuration]);

  return { availableSlots, loadingSlots: loading };
};