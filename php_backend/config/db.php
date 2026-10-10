<?php
/**
 * EchoChat PHP Backend - Database Configuration & PDO Handler
 * Supports SQLite (zero-config, out of the box) and MySQL / MariaDB.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$dbFile = __DIR__ . '/../echochat.sqlite';

try {
    // Default: SQLite for immediate local/server execution without external DB setup
    $pdo = new PDO("sqlite:" . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Initialize tables if they do not exist
    initializeTables($pdo);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

function initializeTables($pdo) {
    // Users table
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        phone_number TEXT,
        avatar TEXT,
        bio TEXT,
        status TEXT DEFAULT 'online',
        accent_color TEXT DEFAULT '#06b6d4',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Conversations table
    $pdo->exec("CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- direct, group, channel, bot
        title TEXT NOT NULL,
        avatar TEXT,
        description TEXT,
        username TEXT,
        is_pinned INTEGER DEFAULT 0,
        is_muted INTEGER DEFAULT 0,
        is_archived INTEGER DEFAULT 0,
        subscribers_count INTEGER DEFAULT 0,
        updated_at TEXT,
        participant_ids TEXT -- JSON array
    )");

    // Messages table
    $pdo->exec("CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_name TEXT,
        sender_avatar TEXT,
        type TEXT DEFAULT 'text', -- text, voice, image, file, poll, call_log
        content TEXT NOT NULL,
        timestamp TEXT,
        status TEXT DEFAULT 'delivered',
        is_edited INTEGER DEFAULT 0,
        reply_to TEXT, -- JSON
        attachments TEXT, -- JSON
        reactions TEXT, -- JSON
        poll_data TEXT, -- JSON
        forwarded_from TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Stories table
    $pdo->exec("CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT,
        user_avatar TEXT,
        image_url TEXT NOT NULL,
        caption TEXT,
        likes_count INTEGER DEFAULT 0,
        created_at TEXT,
        expires_at TEXT
    )");
}
