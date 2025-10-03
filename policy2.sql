CREATE POLICY "Allow authenticated deletes for own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid() = owner);