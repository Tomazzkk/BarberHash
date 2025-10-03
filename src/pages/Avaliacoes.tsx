import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Star, Trash2, MessageSquare, User, Scissors } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/hooks/useSessionStore";
import StatCard from "@/components/StatCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EmptyState from "@/components/EmptyState";
import { getAvatarUrl } from "@/utils/avatar";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  clientes: { name: string } | null;
  barbeiros: { name: string } | null;
};

type ReviewStats = {
  averageRating: number;
  totalReviews: number;
};

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

const Avaliacoes = () => {
    const selectedSede = useSessionStore((state) => state.selectedSede);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats>({ averageRating: 0, totalReviews: 0 });
    const [loading, setLoading] = useState(true);

    const fetchReviewsAndStats = useCallback(async () => {
        setLoading(true);
        let query = supabase
            .from("avaliacoes")
            .select(`id, rating, comment, created_at, clientes ( name ), barbeiros ( name )`)
            .order("created_at", { ascending: false });

        if (selectedSede) {
            query = query.eq("sede_id", selectedSede.id);
        }

        const { data, error } = await query;

        if (error) {
            showError("Erro ao buscar avaliações: " + error.message);
        } else {
            setReviews(data as unknown as Review[]);
            const totalReviews = data.length;
            const averageRating = totalReviews > 0 ? data.reduce((sum, { rating }) => sum + rating, 0) / totalReviews : 0;
            setStats({ totalReviews, averageRating });
        }
        setLoading(false);
    }, [selectedSede]);

    useEffect(() => {
        fetchReviewsAndStats();
    }, [fetchReviewsAndStats]);

    const handleDelete = async (reviewId: string) => {
        const toastId = showLoading("Excluindo avaliação...");
        const { error } = await supabase.from("avaliacoes").delete().eq("id", reviewId);
        dismissToast(toastId);
        if (error) {
            showError("Erro ao excluir avaliação: " + error.message);
        } else {
            showSuccess("Avaliação excluída com sucesso!");
            fetchReviewsAndStats();
        }
    };

    return (
        <>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Avaliações de Clientes</h1>
                
                <div className="grid gap-4 md:grid-cols-2">
                    {loading ? <> <Skeleton className="h-28" /> <Skeleton className="h-28" /> </> : <>
                        <StatCard title="Avaliação Média" value={stats.averageRating.toFixed(1)} icon={<Star />} description={`Baseado em ${stats.totalReviews} avaliações`} />
                        <StatCard title="Total de Avaliações" value={stats.totalReviews.toString()} icon={<MessageSquare />} description="Feedback recebido no total" />
                    </>}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Feedback Recebido</CardTitle>
                        <CardDescription>
                            {selectedSede ? `Avaliações para ${selectedSede.name}.` : "Avaliações de todas as sedes."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
                            </div>
                        ) : reviews.length === 0 ? (
                            <EmptyState
                                icon={<MessageSquare className="h-12 w-12" />}
                                title="Nenhuma avaliação recebida"
                                description="Quando seus clientes avaliarem os serviços, os feedbacks aparecerão aqui."
                            />
                        ) : (
                            <div className="space-y-6">
                                {reviews.map((review) => (
                                    <Card key={review.id} className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <Avatar>
                                                    <AvatarImage src={getAvatarUrl(review.clientes?.name)} />
                                                    <AvatarFallback>{getInitials(review.clientes?.name || '??')}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-semibold">{review.clientes?.name || "Anônimo"}</p>
                                                    </div>
                                                    <StarRating value={review.rating} disabled size={16} onChange={() => {}} />
                                                    {review.comment && (
                                                        <p className="mt-3 text-foreground/80 italic">"{review.comment}"</p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground mt-3">
                                                        Em {format(new Date(review.created_at), "dd/MM/yyyy")} com {review.barbeiros?.name || "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle><AlertDialogDescription>Esta ação removerá permanentemente esta avaliação.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(review.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default Avaliacoes;