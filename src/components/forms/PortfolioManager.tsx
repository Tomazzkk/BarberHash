import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/hooks/useSessionStore";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Upload, Trash2, ImageOff } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

type PortfolioItem = {
  id: string;
  image_url: string;
};

type Barber = {
  id: string;
  name: string;
};

type PortfolioManagerProps = {
  barber: Barber;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PORTFOLIO_ITEMS = 10;

const PortfolioManager = ({ barber }: PortfolioManagerProps) => {
  const user = useSessionStore((state) => state.user);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("barbeiro_portfolio_items")
        .select("id, image_url")
        .eq("barbeiro_id", barber.id)
        .order("created_at", { ascending: false });
      if (error) showError("Erro ao buscar portfólio.");
      else setItems(data || []);
      setLoading(false);
    };
    fetchItems();
  }, [barber.id]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;

    if (items.length >= MAX_PORTFOLIO_ITEMS) {
        showError(`Você atingiu o limite de ${MAX_PORTFOLIO_ITEMS} imagens no portfólio.`);
        return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
        showError("A imagem é muito grande. O tamanho máximo é 5MB.");
        event.target.value = "";
        return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        showError("Tipo de arquivo inválido. Apenas JPG, PNG e WebP são permitidos.");
        event.target.value = "";
        return;
    }

    setUploading(true);
    const toastId = showLoading("Enviando imagem...");

    const filePath = `${user.id}/${barber.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('portfolio')
      .upload(filePath, file);

    if (uploadError) {
      dismissToast(toastId);
      showError(`Erro no upload: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('portfolio')
      .getPublicUrl(filePath);

    const { data: newItem, error: dbError } = await supabase
      .from('barbeiro_portfolio_items')
      .insert({
        barbeiro_id: barber.id,
        user_id: user.id,
        image_url: publicUrl,
      })
      .select()
      .single();

    dismissToast(toastId);
    if (dbError) {
      showError(`Erro ao salvar imagem: ${dbError.message}`);
    } else {
      showSuccess("Imagem adicionada!");
      setItems([newItem, ...items]);
    }
    setUploading(false);
  };

  const handleDelete = async (item: PortfolioItem) => {
    const toastId = showLoading("Excluindo imagem...");
    
    const path = new URL(item.image_url).pathname.split('/portfolio/')[1];
    const { error: storageError } = await supabase.storage.from('portfolio').remove([path]);
    if (storageError) console.error("Erro ao remover do storage:", storageError.message);

    const { error: dbError } = await supabase.from('barbeiro_portfolio_items').delete().eq('id', item.id);
    
    dismissToast(toastId);
    if (dbError) {
      showError("Erro ao excluir imagem.");
    } else {
      showSuccess("Imagem excluída.");
      setItems(items.filter(i => i.id !== item.id));
    }
  };

  const canUpload = items.length < MAX_PORTFOLIO_ITEMS;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="portfolio-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Adicionar nova imagem ({items.length}/{MAX_PORTFOLIO_ITEMS})
        </label>
        <div className="flex items-center gap-2">
            <Input id="portfolio-upload" type="file" accept="image/*" onChange={handleUpload} disabled={uploading || !canUpload} />
            <Button disabled={uploading || !canUpload} variant="outline" size="icon">
                <Upload className={`h-4 w-4 ${uploading ? 'animate-pulse' : ''}`} />
            </Button>
        </div>
        {!canUpload && (
            <p className="text-xs text-destructive mt-2">
                Você atingiu o limite de {MAX_PORTFOLIO_ITEMS} imagens. Exclua uma imagem para adicionar outra.
            </p>
        )}
      </div>
      <div className="max-h-[45vh] overflow-y-auto pr-2">
        {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
            </div>
        ) : items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-2">
                <ImageOff className="h-8 w-8" />
                <p>Nenhuma imagem no portfólio ainda.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {items.map(item => (
                    <div key={item.id} className="relative group">
                        <img src={item.image_url} alt="Portfolio item" className="aspect-square w-full object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="destructive" size="icon" onClick={() => handleDelete(item)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioManager;