-- Add your SQL migration script here

CREATE TYPE token_type AS ENUM ('reset', 'otp');

CREATE TABLE IF NOT EXISTS tokens
(
    id          TEXT         NOT NULL,
    code        TEXT         NOT NULL,
    type        token_type   NOT NULL,
    verified_at TIMESTAMP             DEFAULT NULL,
    expires_at  TIMESTAMP             DEFAULT NULL,

    user_id     TEXT         NOT NULL,

    created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP(3) NOT NULL,

    CONSTRAINT tokens_pkey PRIMARY KEY ("id"),
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
