-- matches: stores each round result
CREATE TABLE IF NOT EXISTS matches (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id   text NOT NULL,
  round_number integer NOT NULL,
  player_move  text NOT NULL CHECK (player_move IN ('rock', 'paper', 'scissors')),
  ai_move      text NOT NULL CHECK (ai_move IN ('rock', 'paper', 'scissors')),
  result       text NOT NULL CHECK (result IN ('win', 'lose', 'draw')),
  thought      text NOT NULL DEFAULT '',
  phase        text NOT NULL DEFAULT 'opening',
  created_at   timestamptz DEFAULT now(),
  UNIQUE(session_id, round_number)
);

-- round_commits: pre-commit model for fair play
CREATE TABLE IF NOT EXISTS round_commits (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id   text NOT NULL,
  round_number integer NOT NULL,
  ai_move      text NOT NULL CHECK (ai_move IN ('rock', 'paper', 'scissors')),
  salt         text NOT NULL,
  commit_hash  text NOT NULL,
  revealed     boolean DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(session_id, round_number)
);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_commits ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts and reads (game is public, no auth required)
CREATE POLICY "Allow anonymous insert on matches"
  ON matches FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select on matches"
  ON matches FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert on round_commits"
  ON round_commits FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select on round_commits"
  ON round_commits FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous update on round_commits"
  ON round_commits FOR UPDATE TO anon USING (true) WITH CHECK (true);
