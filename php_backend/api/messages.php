<?php
/**
 * EchoChat PHP Backend - Messages API
 */

require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? '';
$conversationId = $_GET['conversation_id'] ?? '';

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?? [];

switch ($action) {
    case 'get_messages':
        handleGetMessages($pdo, $conversationId);
        break;
    case 'send':
        handleSendMessage($pdo, $body);
        break;
    case 'edit':
        handleEditMessage($pdo, $body);
        break;
    case 'delete':
        handleDeleteMessage($pdo, $body);
        break;
    case 'react':
        handleReactMessage($pdo, $body);
        break;
    case 'poll_vote':
        handlePollVote($pdo, $body);
        break;
    default:
        if (!empty($conversationId)) {
            handleGetMessages($pdo, $conversationId);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Action or conversation_id required']);
        }
        break;
}

function handleGetMessages($pdo, $conversationId) {
    if (empty($conversationId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'conversation_id required']);
        return;
    }

    $stmt = $pdo->prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC");
    $stmt->execute([$conversationId]);
    $rawMessages = $stmt->fetchAll();

    $messages = array_map(function($m) {
        return [
            'id' => $m['id'],
            'conversationId' => $m['conversation_id'],
            'senderId' => $m['sender_id'],
            'senderName' => $m['sender_name'],
            'senderAvatar' => $m['sender_avatar'],
            'type' => $m['type'],
            'content' => $m['content'],
            'timestamp' => $m['timestamp'],
            'status' => $m['status'],
            'isEdited' => (bool)$m['is_edited'],
            'replyTo' => json_decode($m['reply_to'] ?? '', true),
            'attachments' => json_decode($m['attachments'] ?? '', true) ?: [],
            'reactions' => json_decode($m['reactions'] ?? '', true) ?: [],
            'poll' => json_decode($m['poll_data'] ?? '', true),
            'forwardedFrom' => $m['forwarded_from'],
        ];
    }, $rawMessages);

    echo json_encode(['success' => true, 'messages' => $messages]);
}

function handleSendMessage($pdo, $data) {
    $conversationId = $data['conversationId'] ?? '';
    $content = $data['content'] ?? '';
    $senderId = $data['senderId'] ?? 'user_me';
    $senderName = $data['senderName'] ?? 'کاربر';
    $type = $data['type'] ?? 'text';

    if (empty($conversationId) || (empty($content) && empty($data['attachments']))) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'conversationId and content are required']);
        return;
    }

    $id = $data['id'] ?? ('msg_' . time() . '_' . substr(md5(uniqid()), 0, 4));
    $timestamp = $data['timestamp'] ?? date('H:i');
    $replyTo = !empty($data['replyTo']) ? json_encode($data['replyTo']) : null;
    $attachments = !empty($data['attachments']) ? json_encode($data['attachments']) : null;
    $reactions = json_encode([]);
    $pollData = !empty($data['poll']) ? json_encode($data['poll']) : null;

    $stmt = $pdo->prepare("INSERT INTO messages (id, conversation_id, sender_id, sender_name, type, content, timestamp, status, reply_to, attachments, reactions, poll_data) VALUES (?, ?, ?, ?, ?, ?, ?, 'delivered', ?, ?, ?, ?)");
    $stmt->execute([$id, $conversationId, $senderId, $senderName, $type, $content, $timestamp, $replyTo, $attachments, $reactions, $pollData]);

    // Update conversation timestamp
    $pdo->prepare("UPDATE conversations SET updated_at = ? WHERE id = ?")->execute([$timestamp, $conversationId]);

    echo json_encode(['success' => true, 'message' => [
        'id' => $id,
        'conversationId' => $conversationId,
        'senderId' => $senderId,
        'senderName' => $senderName,
        'type' => $type,
        'content' => $content,
        'timestamp' => $timestamp,
        'status' => 'delivered',
        'replyTo' => $data['replyTo'] ?? null,
        'attachments' => $data['attachments'] ?? [],
        'reactions' => [],
        'poll' => $data['poll'] ?? null,
    ]]);
}

function handleEditMessage($pdo, $data) {
    $messageId = $data['messageId'] ?? '';
    $newContent = $data['newContent'] ?? '';

    if (empty($messageId) || empty($newContent)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'messageId and newContent required']);
        return;
    }

    $stmt = $pdo->prepare("UPDATE messages SET content = ?, is_edited = 1 WHERE id = ?");
    $stmt->execute([$newContent, $messageId]);

    echo json_encode(['success' => true]);
}

function handleDeleteMessage($pdo, $data) {
    $messageId = $data['messageId'] ?? '';
    if (empty($messageId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'messageId required']);
        return;
    }

    $stmt = $pdo->prepare("DELETE FROM messages WHERE id = ?");
    $stmt->execute([$messageId]);

    echo json_encode(['success' => true]);
}

function handleReactMessage($pdo, $data) {
    $messageId = $data['messageId'] ?? '';
    $emoji = $data['emoji'] ?? '👍';
    $userId = $data['userId'] ?? 'user_me';

    $stmt = $pdo->prepare("SELECT reactions FROM messages WHERE id = ?");
    $stmt->execute([$messageId]);
    $row = $stmt->fetch();
    if (!$row) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Message not found']);
        return;
    }

    $reactions = json_decode($row['reactions'] ?? '[]', true) ?: [];
    $found = false;

    foreach ($reactions as &$r) {
        if ($r['emoji'] === $emoji) {
            $found = true;
            if (in_array($userId, $r['userIds'])) {
                $r['userIds'] = array_values(array_diff($r['userIds'], [$userId]));
                $r['count'] = count($r['userIds']);
            } else {
                $r['userIds'][] = $userId;
                $r['count'] = count($r['userIds']);
            }
            break;
        }
    }
    unset($r);

    if (!$found) {
        $reactions[] = ['emoji' => $emoji, 'count' => 1, 'userIds' => [$userId]];
    }

    $reactions = array_values(array_filter($reactions, fn($r) => $r['count'] > 0));

    $pdo->prepare("UPDATE messages SET reactions = ? WHERE id = ?")->execute([json_encode($reactions), $messageId]);
    echo json_encode(['success' => true, 'reactions' => $reactions]);
}

function handlePollVote($pdo, $data) {
    $messageId = $data['messageId'] ?? '';
    $optionId = $data['optionId'] ?? '';
    $userId = $data['userId'] ?? 'user_me';

    $stmt = $pdo->prepare("SELECT poll_data FROM messages WHERE id = ?");
    $stmt->execute([$messageId]);
    $row = $stmt->fetch();
    if (!$row || empty($row['poll_data'])) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Poll not found']);
        return;
    }

    $poll = json_decode($row['poll_data'], true);
    foreach ($poll['options'] as &$opt) {
        if ($opt['id'] === $optionId) {
            if (in_array($userId, $opt['votedUserIds'])) {
                $opt['votedUserIds'] = array_values(array_diff($opt['votedUserIds'], [$userId]));
            } else {
                $opt['votedUserIds'][] = $userId;
            }
            $opt['votes'] = count($opt['votedUserIds']);
        }
    }
    unset($opt);

    $poll['totalVotes'] = array_sum(array_column($poll['options'], 'votes'));
    $pdo->prepare("UPDATE messages SET poll_data = ? WHERE id = ?")->execute([json_encode($poll), $messageId]);

    echo json_encode(['success' => true, 'poll' => $poll]);
}
