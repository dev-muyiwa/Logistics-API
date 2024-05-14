-- Add your SQL migration script here

CREATE TYPE status_type AS ENUM ('Pending', 'In Transit', 'Out for Delivery', 'Delivered');


CREATE TABLE IF NOT EXISTS packages
(
    id              TEXT         NOT NULL,
    name            TEXT         NOT NULL,
    description     TEXT                  DEFAULT NULL,
    status          status_type  NOT NULL DEFAULT 'Pending',
    pickup_date     TIMESTAMP(3) NOT NULL,
    primary_email   TEXT         NOT NULL,
    secondary_email TEXT                  DEFAULT NULL,
    tracking_code   TEXT         NOT NULL,

    user_id         TEXT         NOT NULL,

    created_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP(3) NOT NULL,

    CONSTRAINT packages_pkey PRIMARY KEY ("id"),
    CONSTRAINT unique_tracking_code UNIQUE (tracking_code),
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX if not exists idx_tracking_code ON packages (tracking_code);

