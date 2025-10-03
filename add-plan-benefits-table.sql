CREATE TABLE plan_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    icon TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE plan_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their own plan benefits"
ON plan_benefits
FOR ALL
USING (auth.uid() = owner_user_id);