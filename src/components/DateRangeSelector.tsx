import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DateRange } from "react-day-picker";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type DateRangeSelectorProps = {
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    className?: string;
};

export const DateRangeSelector = ({ date, setDate, className }: DateRangeSelectorProps) => {
    const handlePreset = (preset: 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth') => {
        const now = new Date();
        switch (preset) {
            case 'today':
                setDate({ from: now, to: now });
                break;
            case 'yesterday':
                setDate({ from: subDays(now, 1), to: subDays(now, 1) });
                break;
            case 'last7':
                setDate({ from: subDays(now, 6), to: now });
                break;
            case 'last30':
                setDate({ from: subDays(now, 29), to: now });
                break;
            case 'thisMonth':
                setDate({ from: startOfMonth(now), to: endOfMonth(now) });
                break;
            case 'lastMonth':
                const lastMonthStart = startOfMonth(subDays(now, 30));
                setDate({ from: lastMonthStart, to: endOfMonth(lastMonthStart) });
                break;
        }
    };

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        Períodos
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handlePreset('today')}>Hoje</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePreset('yesterday')}>Ontem</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePreset('last7')}>Últimos 7 dias</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePreset('last30')}>Últimos 30 dias</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePreset('thisMonth')}>Este Mês</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePreset('lastMonth')}>Mês Passado</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-[180px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? format(date.from, "dd/MM/y", { locale: ptBR }) : <span>Data Início</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date?.from} onSelect={(d) => setDate({ from: d, to: date?.to })} initialFocus />
                </PopoverContent>
            </Popover>

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-[180px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.to ? format(date.to, "dd/MM/y", { locale: ptBR }) : <span>Data Fim</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date?.to} onSelect={(d) => setDate({ from: date?.from, to: d })} initialFocus />
                </PopoverContent>
            </Popover>

            {date && (
                <Button variant="ghost" size="icon" onClick={() => setDate(undefined)}>
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
};