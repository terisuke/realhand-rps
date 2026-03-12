-- Drop the overly permissive UPDATE policy on round_commits
DROP POLICY IF EXISTS "Allow anonymous update on round_commits" ON round_commits;

-- Recreate with restricted UPDATE: only allow setting revealed=true
CREATE POLICY "Allow anonymous reveal on round_commits"
  ON round_commits FOR UPDATE TO anon
  USING (revealed = false)
  WITH CHECK (revealed = true);

-- Add DELETE restriction (no deletes allowed)
-- INSERT and SELECT policies remain unchanged (needed for game flow)
