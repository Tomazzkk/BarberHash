import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Package } from "lucide-react";

// Use string paths for images in the public directory
const dashboardHero = '/assets/dashboard-hero.jpg';
const loginBg = '/assets/login-bg.jpg';
const ogImage = '/assets/og-image.jpg';

type Product = {
    id: string;
    name: string;
    price: number;
    image_url?: string | null;
};

interface FeaturedProductsCarouselProps {
    products: Product[];
}

// Array of local image paths
const localProductImages = [
    dashboardHero,
    loginBg,
    ogImage,
];

const FeaturedProductsCarousel: React.FC<FeaturedProductsCarouselProps> = ({ products }) => {
    const plugin = React.useRef(
        Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })
    );

    if (products.length === 0) {
        return (
            <Card className="bg-muted/50">
                <CardContent className="p-6 text-center text-muted-foreground flex flex-col items-center gap-2">
                    <Package className="h-8 w-8" />
                    <p className="font-medium">Vitrine em Breve</p>
                    <p className="text-sm">Nossos produtos incríveis aparecerão aqui assim que forem cadastrados!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Carousel
            plugins={[plugin.current]}
            className="w-full"
            opts={{ align: "start", loop: true }}
        >
            <CarouselContent className="-ml-4">
                {products.map((product, index) => (
                    <CarouselItem key={product.id} className="pl-4 basis-2/3 md:basis-1/3">
                        <div className="relative aspect-[4/3] group overflow-hidden rounded-lg">
                            <img
                                src={product.image_url || localProductImages[index % localProductImages.length]}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-4 text-white">
                                <h3 className="font-bold text-lg">{product.name}</h3>
                                <p className="text-sm">R$ {product.price.toFixed(2)}</p>
                            </div>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
};

export default FeaturedProductsCarousel;