import { useSessionStore } from "@/hooks/useSessionStore";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

const SedeSelector = () => {
    const { selectedSede } = useSessionStore();

    if (!selectedSede) {
        return (
            <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/sedes">Criar primeira sede</Link>
            </Button>
        )
    }

    return (
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-primary bg-muted truncate">
            <Home className="h-4 w-4 shrink-0" />
            <span className="truncate">{selectedSede.name}</span>
        </div>
    );
};

export default SedeSelector;