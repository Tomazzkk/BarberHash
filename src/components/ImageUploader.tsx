import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, UploadCloud } from 'lucide-react';
import { showLoading, dismissToast, showError } from '@/utils/toast';

type ImageUploaderProps = {
  bucketName: string;
  filePath: string;
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
};

const ImageUploader = ({ bucketName, filePath, currentUrl, onUpload, onRemove }: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const toastId = showLoading('Enviando imagem...');
    setUploading(true);

    const fileExt = file.name.split('.').pop();
    // Add a timestamp to bust cache and ensure a unique URL
    const fullFilePath = `${filePath}/${new Date().getTime()}.${fileExt}`;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(fullFilePath, file, { upsert: false });

    setUploading(false);
    dismissToast(toastId);

    if (error) {
      showError(`Erro no upload: ${error.message}`);
    } else {
      const { data } = supabase.storage.from(bucketName).getPublicUrl(fullFilePath);
      onUpload(data.publicUrl);
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" onClick={triggerFileSelect} variant="outline" size="sm" disabled={uploading}>
        <UploadCloud className="mr-2 h-4 w-4" />
        {uploading ? 'Enviando...' : (currentUrl ? 'Trocar' : 'Enviar Foto')}
      </Button>
      <Input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
        disabled={uploading}
        id={`file-upload-${filePath.replace(/\W/g, '-')}`}
      />
      {currentUrl && (
        <Button type="button" onClick={onRemove} variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Remover
        </Button>
      )}
    </div>
  );
};

export default ImageUploader;