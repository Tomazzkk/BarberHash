-- Drop the helper function as it's no longer needed
DROP FUNCTION IF EXISTS get_owner_for_current_user();

-- Drop the previous policy
DROP POLICY IF EXISTS "Owners and their staff can manage plan benefits" ON public.plan_benefits;
DROP POLICY IF EXISTS "Owners can manage their own plan benefits" ON public.plan_benefits;

-- Create a new, more direct policy
CREATE POLICY "Owners and their staff can manage plan benefits"
ON public.plan_benefits
FOR ALL
USING (
  -- A user can access a benefit if they are the owner of it
  owner_user_id = auth.uid() OR
  -- OR if the benefit's owner is the same as the current user's owner
  owner_user_id = (SELECT owner_id FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
  -- When creating/updating, ensure the benefit is associated with the correct owner
  owner_user_id = COALESCE(
    (SELECT owner_id FROM public.profiles WHERE id = auth.uid()),
    auth.uid()
  )
);