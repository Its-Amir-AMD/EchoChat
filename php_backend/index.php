<?php
/**
 * EchoChat PHP Backend - Universal Unified Router
 */

$endpoint = $_GET['endpoint'] ?? '';

switch ($endpoint) {
    case 'auth':
        require __DIR__ . '/api/auth.php';
        break;
    case 'conversations':
        require __DIR__ . '/api/conversations.php';
        break;
    case 'messages':
        require __DIR__ . '/api/messages.php';
        break;
    case 'stories':
        require __DIR__ . '/api/stories.php';
        break;
    case 'ai':
        require __DIR__ . '/api/ai_assistant.php';
        break;
    default:
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'status' => 'online',
            'system' => 'EchoChat PHP Backend API v2.0',
            'endpoints' => [
                'auth' => '/api/auth.php?action=login|register|profile',
                'conversations' => '/api/conversations.php?action=list|create_group|create_channel',
                'messages' => '/api/messages.php?action=get_messages|send|edit|delete|react|poll_vote',
                'stories' => '/api/stories.php?action=list|create|like',
                'ai' => '/api/ai_assistant.php',
            ]
        ]);
        break;
}
