CREATE POLICY "Allow authenticated inserts for product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');