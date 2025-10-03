import { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { canvasPreview } from '@/utils/cropImage';

interface AvatarCropperProps {
  imgSrc: string;
  onCropComplete: (blob: Blob) => void;
  onCancel: () => void;
}

const AvatarCropper = ({ imgSrc, onCropComplete, onCancel }: AvatarCropperProps) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  }

  async function handleSaveCrop() {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!image || !previewCanvas || !completedCrop) {
      throw new Error('Crop canvas does not exist');
    }

    await canvasPreview(image, previewCanvas, completedCrop);

    previewCanvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/png');
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
          >
            <img
              ref={imgRef}
              src={imgSrc}
              onLoad={onImageLoad}
              alt="Crop me"
              style={{ maxHeight: '70vh' }}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>
        <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSaveCrop}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarCropper;