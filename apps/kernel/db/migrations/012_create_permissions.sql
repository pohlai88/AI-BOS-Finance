CREATE TABLE IF NOT EXISTS permissions (
  permission_code TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
