<?php
/**
 * EchoChat PHP Backend - Conversations API (Direct, Groups, Channels)
 */

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?? [];

switch ($action) {
    case 'list':
        handleListConversations($pdo);
        break;
    case 'create_group':
        handleCreateGroup($pdo, $body);
        break;
    case 'create_channel':
        handleCreateChannel($pdo, $body);
        break;
    default:
        handleListConversations($pdo);
        break;
}

function handleListConversations($pdo) {
    $userId = $_GET['userId'] ?? 'user_me';
    $stmt = $pdo->query("SELECT * FROM conversations ORDER BY is_pinned DESC, updated_at DESC");
    $rawList = $stmt->fetchAll();

    $conversations = array_map(function($row) use ($pdo) {
        $pIds = json_decode($row['participant_ids'] ?? '[]', true) ?: [];

        // Fetch last message
        $stmtMsg = $pdo->prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1");
        $stmtMsg->execute([$row['id']]);
        $last = $stmtMsg->fetch();

        $lastMessage = null;
        if ($last) {
            $lastMessage = [
                'id' => $last['id'],
                'senderId' => $last['sender_id'],
                'senderName' => $last['sender_name'],
                'content' => $last['content'],
                'timestamp' => $last['timestamp'],
                'type' => $last['type'],
                'status' => $last['status'],
            ];
        }

        return [
            'id' => $row['id'],
            'type' => $row['type'],
            'title' => $row['title'],
            'avatar' => $row['avatar'],
            'description' => $row['description'],
            'username' => $row['username'],
            'isPinned' => (bool)$row['is_pinned'],
            'isMuted' => (bool)$row['is_muted'],
            'isArchived' => (bool)$row['is_archived'],
            'subscribersCount' => (int)$row['subscribers_count'],
            'updatedAt' => $row['updated_at'] ?: 'الان',
            'unreadCount' => 0,
            'participantIds' => $pIds,
            'lastMessage' => $lastMessage,
        ];
    }, $rawList);

    echo json_encode(['success' => true, 'conversations' => $conversations]);
}

function handleCreateGroup($pdo, $data) {
    $title = trim($data['title'] ?? '');
    $description = trim($data['description'] ?? '');
    $participantIds = $data['participantIds'] ?? ['user_me'];
    $creatorId = $data['creatorId'] ?? 'user_me';

    if (empty($title)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Group title is required']);
        return;
    }

    $id = 'group_' . time();
    $avatar = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150';
    $pIdsJson = json_encode(array_values(array_unique(array_merge([$creatorId], $participantIds))));
    $updatedAt = date('H:i');

    $stmt = $pdo->prepare("INSERT INTO conversations (id, type, title, avatar, description, is_pinned, is_muted, is_archived, updated_at, participant_ids) VALUES (?, 'group', ?, ?, ?, 0, 0, 0, ?, ?)");
    $stmt->execute([$id, $title, $avatar, $description, $updatedAt, $pIdsJson]);

    // Initial announcement message
    $msgStmt = $pdo->prepare("INSERT INTO messages (id, conversation_id, sender_id, sender_name, type, content, timestamp, status) VALUES (?, ?, ?, 'سیستم', 'text', ?, ?, 'read')");
    $msgStmt->execute(['msg_' . time(), $id, $creatorId, "گروه «{$title}» ایجاد شد.", $updatedAt]);

    echo json_encode(['success' => true, 'id' => $id, 'conversation' => [
        'id' => $id,
        'type' => 'group',
        'title' => $title,
        'avatar' => $avatar,
        'description' => $description,
        'participantIds' => json_decode($pIdsJson, true),
        'updatedAt' => $updatedAt,
    ]]);
}

function handleCreateChannel($pdo, $data) {
    $title = trim($data['title'] ?? '');
    $description = trim($data['description'] ?? '');
    $username = ltrim(trim($data['username'] ?? ''), '@');
    $creatorId = $data['creatorId'] ?? 'user_me';

    if (empty($title)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Channel title is required']);
        return;
    }

    $id = 'channel_' . time();
    $avatar = 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=150';
    $pIdsJson = json_encode([$creatorId]);
    $updatedAt = date('H:i');

    $stmt = $pdo->prepare("INSERT INTO conversations (id, type, title, avatar, description, username, is_pinned, is_muted, is_archived, subscribers_count, updated_at, participant_ids) VALUES (?, 'channel', ?, ?, ?, ?, 0, 0, 0, 1, ?, ?)");
    $stmt->execute([$id, $title, $avatar, $description, $username ?: $id, $updatedAt, $pIdsJson]);

    echo json_encode(['success' => true, 'id' => $id, 'conversation' => [
        'id' => $id,
        'type' => 'channel',
        'title' => $title,
        'avatar' => $avatar,
        'description' => $description,
        'username' => $username,
        'subscribersCount' => 1,
        'updatedAt' => $updatedAt,
    ]]);
}
