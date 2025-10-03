import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Search } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useSessionStore } from "@/hooks/useSessionStore"

type Sede = {
  id: string;
  name: string;
  address: string | null;
};

type SedeSelectorDrawerProps = {
  selectedSede: Sede | null;
  onSedeSelect: (sede: Sede | null) => void;
  children: React.ReactNode;
};

const SedeSelectorDrawer = ({ onSedeSelect, children }: SedeSelectorDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { config } = useSessionStore();

  useEffect(() => {
    const fetchSedes = async () => {
      if (!config) return;
      const { data } = await supabase
        .from("sedes")
        .select("id, name, address")
        .eq("user_id", config.user_id);
      if (data) setSedes(data);
    };
    fetchSedes();
  }, [config]);

  const filteredSedes = useMemo(() => {
    return sedes.filter(sede => 
      sede.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sede.address && sede.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sedes, searchTerm]);

  const handleSelect = (sede: Sede) => {
    onSedeSelect(sede);
    setIsOpen(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="h-[80vh] flex flex-col">
        <DrawerHeader>
          <DrawerTitle>Selecionar Unidade</DrawerTitle>
        </DrawerHeader>
        <div className="relative my-4 px-4">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar pelo nome ou endereço..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ScrollArea className="flex-grow px-4">
          <div className="space-y-2">
            {filteredSedes.length > 0 ? (
              filteredSedes.map(sede => (
                <div
                  key={sede.id}
                  className="p-4 border rounded-lg flex items-center gap-3 cursor-pointer hover:bg-muted"
                  onClick={() => handleSelect(sede)}
                >
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">{sede.name}</p>
                    <p className="text-sm text-muted-foreground">{sede.address}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>Nenhuma unidade encontrada.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};

export default SedeSelectorDrawer;