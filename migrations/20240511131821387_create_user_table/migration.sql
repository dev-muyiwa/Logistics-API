-- Add your SQL migration script here
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users
(
    id            TEXT         NOT NULL,
    first_name    TEXT         NOT NULL,
    last_name     TEXT         NOT NULL,
    email         TEXT         NOT NULL UNIQUE,
    password      TEXT         NOT NULL,
    phone_number  TEXT                  DEFAULT NULL,
    refresh_token VARCHAR               DEFAULT NULL,

    created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP(3) NOT NULL,

    CONSTRAINT users_pkey PRIMARY KEY ("id"),
    CONSTRAINT unique_email UNIQUE (email)
);

CREATE INDEX if not exists idx_email ON users (email);
