import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

type BarberProfileData = {
  name: string;
  bio: string | null;
  avatar_url: string | null;
  barbeiro_portfolio_items: { image_url: string }[];
  // Mock data for stats
  experience_years: number;
  happy_clients: number;
  rating: number;
};

const BarberProfile = () => {
  const { barberId } = useParams();
  const navigate = useNavigate();
  const [barber, setBarber] = useState<BarberProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const plugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true }));

  useEffect(() => {
    const fetchBarberProfile = async () => {
      setLoading(true);
      
      const mockBarber: BarberProfileData = {
        name: "Ricardo Alves",
        bio: "Com mais de 5 anos de experiência, sou especialista em cortes clássicos e modernos, sempre focado em entregar o melhor resultado para cada cliente.",
        avatar_url: `https://picsum.photos/seed/barber_avatar/800/800`,
        barbeiro_portfolio_items: [
          { image_url: "https://picsum.photos/seed/portfolio1/500/500" },
          { image_url: "https://picsum.photos/seed/portfolio2/500/500" },
          { image_url: "https://picsum.photos/seed/portfolio3/500/500" },
          { image_url: "https://picsum.photos/seed/portfolio4/500/500" },
          { image_url: "https://picsum.photos/seed/portfolio5/500/500" },
          { image_url: "https://picsum.photos/seed/portfolio6/500/500" },
        ],
        experience_years: 5,
        happy_clients: 343,
        rating: 4.9,
      };

      if (!barberId) {
        setBarber(mockBarber);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("barbeiros")
        .select("name, bio, avatar_url, barbeiro_portfolio_items(image_url)")
        .eq("id", barberId)
        .single();

      if (error || !data) {
        console.error("Error fetching barber profile or no data found, using mock data:", error);
        setBarber(mockBarber);
      } else {
        const profileData: BarberProfileData = {
          ...(data as any),
          experience_years: 5,
          happy_clients: 343,
          rating: 4.9,
          avatar_url: data.avatar_url || mockBarber.avatar_url,
          barbeiro_portfolio_items: data.barbeiro_portfolio_items.length > 0 ? data.barbeiro_portfolio_items : mockBarber.barbeiro_portfolio_items,
        };
        setBarber(profileData);
      }
      setLoading(false);
    };
    fetchBarberProfile();
  }, [barberId]);

  const handleBook = () => {
    if (barberId) {
        navigate('/app/agendar', { state: { barbeiro_id: barberId } });
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Skeleton className="h-80 w-full" />
        <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-full max-w-md mx-auto" />
            <Skeleton className="h-4 w-5/6 max-w-md mx-auto" />
            <div className="flex justify-around my-8">
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 w-24" />
            </div>
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="flex gap-4">
                <Skeleton className="h-40 w-40 flex-shrink-0" />
                <Skeleton className="h-40 w-40 flex-shrink-0" />
            </div>
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-bold">Barbeiro não encontrado</h1>
        <Button asChild variant="link" className="mt-4" onClick={() => navigate(-1)}>
          <span><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-24 text-foreground">
      <div className="relative h-80 w-full">
        <img src={barber.avatar_url || ''} alt={barber.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <Button variant="ghost" size="icon" className="absolute top-4 left-4 rounded-full bg-background/50 backdrop-blur-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      <main className="p-4 -mt-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          <h2 className="text-3xl font-bold">{barber.name}</h2>
          <p className="mt-2 text-muted-foreground max-w-md">
            {barber.bio || "Especialista em cortes clássicos e modernos, pronto para transformar seu visual."}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-around text-center my-8"
        >
          <div>
            <p className="text-2xl font-bold">{barber.experience_years} anos</p>
            <p className="text-sm text-muted-foreground">Experiência</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{barber.happy_clients}</p>
            <p className="text-sm text-muted-foreground">Clientes Felizes</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 text-primary fill-primary" />
              <p className="text-2xl font-bold">{barber.rating.toFixed(1).replace('.', ',')}</p>
            </div>
            <p className="text-sm text-muted-foreground">Avaliação</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-xl font-bold mb-4">Portfólio</h3>
          {barber.barbeiro_portfolio_items.length > 0 ? (
            <Carousel
              plugins={[plugin.current]}
              className="w-full -mx-4"
              opts={{ align: "start", loop: true }}
            >
              <CarouselContent className="ml-4">
                {barber.barbeiro_portfolio_items.map((item, index) => (
                  <CarouselItem key={index} className="pl-4 basis-2/5 md:basis-1/4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="relative aspect-square overflow-hidden rounded-lg shadow-md cursor-pointer group">
                          <img
                            src={item.image_url}
                            alt={`Trabalho de ${barber.name} ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl p-0 bg-transparent border-none">
                        <img
                          src={item.image_url}
                          alt={`Trabalho de ${barber.name} ${index + 1}`}
                          className="w-full h-auto rounded-lg"
                        />
                      </DialogContent>
                    </Dialog>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : (
            <p className="text-muted-foreground">Nenhum trabalho no portfólio ainda.</p>
          )}
        </motion.div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
        <Button size="lg" className="w-full h-12 font-bold bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleBook}>
          Agendar
        </Button>
      </footer>
    </div>
  );
};

export default BarberProfile;