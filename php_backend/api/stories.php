<?php
/**
 * EchoChat PHP Backend - Stories API (24-Hour Stories)
 */

require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? '';
$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?? [];

switch ($action) {
    case 'list':
        handleListStories($pdo);
        break;
    case 'create':
        handleCreateStory($pdo, $body);
        break;
    case 'like':
        handleLikeStory($pdo, $_GET['id'] ?? ($body['id'] ?? ''));
        break;
    default:
        handleListStories($pdo);
        break;
}

function handleListStories($pdo) {
    $stmt = $pdo->query("SELECT * FROM stories ORDER BY created_at DESC");
    $raw = $stmt->fetchAll();

    $stories = array_map(function($s) {
        return [
            'id' => $s['id'],
            'userId' => $s['user_id'],
            'userName' => $s['user_name'],
            'userAvatar' => $s['user_avatar'],
            'imageUrl' => $s['image_url'],
            'caption' => $s['caption'],
            'likesCount' => (int)$s['likes_count'],
            'createdAt' => $s['created_at'],
            'expiresAt' => $s['expires_at'],
            'isViewed' => false,
        ];
    }, $raw);

    echo json_encode(['success' => true, 'stories' => $stories]);
}

function handleCreateStory($pdo, $data) {
    $imageUrl = $data['imageUrl'] ?? '';
    if (empty($imageUrl)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'imageUrl is required']);
        return;
    }

    $id = 'story_' . time();
    $userId = $data['userId'] ?? 'user_me';
    $userName = $data['userName'] ?? 'امیرمحمد';
    $userAvatar = $data['userAvatar'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    $caption = $data['caption'] ?? '';
    $createdAt = 'لحظاتی پیش';
    $expiresAt = '۲۴ ساعت دیگر';

    $stmt = $pdo->prepare("INSERT INTO stories (id, user_id, user_name, user_avatar, image_url, caption, likes_count, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)");
    $stmt->execute([$id, $userId, $userName, $userAvatar, $imageUrl, $caption, $createdAt, $expiresAt]);

    echo json_encode(['success' => true, 'story' => [
        'id' => $id,
        'userId' => $userId,
        'userName' => $userName,
        'userAvatar' => $userAvatar,
        'imageUrl' => $imageUrl,
        'caption' => $caption,
        'likesCount' => 0,
        'createdAt' => $createdAt,
        'expiresAt' => $expiresAt,
        'isViewed' => false,
    ]]);
}

function handleLikeStory($pdo, $storyId) {
    if (empty($storyId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'storyId required']);
        return;
    }

    $stmt = $pdo->prepare("UPDATE stories SET likes_count = likes_count + 1 WHERE id = ?");
    $stmt->execute([$storyId]);

    echo json_encode(['success' => true]);
}
