import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center bg-login-bg text-center p-4">
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 p-8 bg-background/80 rounded-lg shadow-xl text-foreground">
        <Search className="h-16 w-16 text-primary mb-4 mx-auto" />
        <h1 className="text-6xl font-bold">404</h1>
        <h2 className="text-2xl font-semibold text-muted-foreground mt-2">Página Não Encontrada</h2>
        <p className="mt-4 max-w-md text-muted-foreground">
          Desculpe, não conseguimos encontrar a página que você está procurando. Talvez ela tenha sido movida ou o endereço esteja incorreto.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Voltar para o Início
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;