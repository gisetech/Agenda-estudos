-- SQL migration for creating a separated schema and tables for the new site
-- Execute this script directly in your Supabase SQL Editor

-- 1. Create the separate schema 'novo_site' to ensure full isolation from existing tables
CREATE SCHEMA IF NOT EXISTS novo_site;

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS novo_site.courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    total_hours NUMERIC,
    color TEXT NOT NULL DEFAULT '#0f172a',
    access_link TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sessions (Classes) Table
CREATE TABLE IF NOT EXISTS novo_site.sessions (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES novo_site.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date TEXT NOT NULL, -- Date format "YYYY-MM-DD"
    start_time TEXT NOT NULL, -- Time format "HH:MM"
    end_time TEXT NOT NULL, -- Time format "HH:MM"
    access_link TEXT,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled' | 'canceled' | 'completed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tasks (Deliveries) Table
CREATE TABLE IF NOT EXISTS novo_site.tasks (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES novo_site.courses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT NOT NULL, -- Date format "YYYY-MM-DD"
    due_time TEXT, -- Time format "HH:MM"
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'completed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Notes Table
CREATE TABLE IF NOT EXISTS novo_site.notes (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES novo_site.courses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL, -- ISO timestamp
    updated_at TEXT NOT NULL -- ISO timestamp
);

-- 6. Enable Row Level Security (RLS) for all tables
ALTER TABLE novo_site.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE novo_site.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE novo_site.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE novo_site.notes ENABLE ROW LEVEL SECURITY;

-- 7. Add public/anon read/write policies (adjust as needed for authenticated users in production)
CREATE POLICY "Allow anonymous select on courses" ON novo_site.courses FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on courses" ON novo_site.courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on courses" ON novo_site.courses FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on courses" ON novo_site.courses FOR DELETE USING (true);

CREATE POLICY "Allow anonymous select on sessions" ON novo_site.sessions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on sessions" ON novo_site.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on sessions" ON novo_site.sessions FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on sessions" ON novo_site.sessions FOR DELETE USING (true);

CREATE POLICY "Allow anonymous select on tasks" ON novo_site.tasks FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on tasks" ON novo_site.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on tasks" ON novo_site.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on tasks" ON novo_site.tasks FOR DELETE USING (true);

CREATE POLICY "Allow anonymous select on notes" ON novo_site.notes FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on notes" ON novo_site.notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on notes" ON novo_site.notes FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on notes" ON novo_site.notes FOR DELETE USING (true);
