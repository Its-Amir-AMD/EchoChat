-- EchoChat Production Database Schema (MySQL / MariaDB / SQLite)

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    username VARCHAR(64) UNIQUE NOT NULL,
    phone_number VARCHAR(32),
    avatar TEXT,
    bio TEXT,
    status VARCHAR(16) DEFAULT 'online',
    accent_color VARCHAR(16) DEFAULT '#06b6d4',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(16) NOT NULL, -- direct, group, channel, bot
    title VARCHAR(128) NOT NULL,
    avatar TEXT,
    description TEXT,
    username VARCHAR(64),
    is_pinned TINYINT(1) DEFAULT 0,
    is_muted TINYINT(1) DEFAULT 0,
    is_archived TINYINT(1) DEFAULT 0,
    subscribers_count INT DEFAULT 0,
    updated_at VARCHAR(32),
    participant_ids TEXT -- JSON array of user IDs
);

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL,
    sender_id VARCHAR(64) NOT NULL,
    sender_name VARCHAR(128),
    sender_avatar TEXT,
    type VARCHAR(16) DEFAULT 'text', -- text, voice, image, file, poll, call_log
    content TEXT NOT NULL,
    timestamp VARCHAR(32),
    status VARCHAR(16) DEFAULT 'delivered',
    is_edited TINYINT(1) DEFAULT 0,
    reply_to TEXT, -- JSON
    attachments TEXT, -- JSON
    reactions TEXT, -- JSON
    poll_data TEXT, -- JSON
    forwarded_from VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conv (conversation_id),
    INDEX idx_sender (sender_id)
);

CREATE TABLE IF NOT EXISTS stories (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(128),
    user_avatar TEXT,
    image_url TEXT NOT NULL,
    caption TEXT,
    likes_count INT DEFAULT 0,
    created_at VARCHAR(32),
    expires_at VARCHAR(32)
);
