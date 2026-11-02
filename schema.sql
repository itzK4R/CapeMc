-- Run this once in Cloudflare: Storage & databases > D1 > your database > Console.

CREATE TABLE IF NOT EXISTS players (
    uuid       TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    first_seen INTEGER NOT NULL,
    last_seen  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS name_history (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid    TEXT NOT NULL,
    name    TEXT NOT NULL,
    seen_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_name_unique ON name_history (uuid, name);

CREATE TABLE IF NOT EXISTS cape_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid       TEXT NOT NULL,
    cape_hash  TEXT NOT NULL,
    first_seen INTEGER NOT NULL,
    last_seen  INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cape_unique ON cape_history (uuid, cape_hash);
CREATE INDEX IF NOT EXISTS idx_cape_hash ON cape_history (cape_hash);

CREATE TABLE IF NOT EXISTS skin_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid       TEXT NOT NULL,
    skin_hash  TEXT NOT NULL,
    first_seen INTEGER NOT NULL,
    last_seen  INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_skin_unique ON skin_history (uuid, skin_hash);
