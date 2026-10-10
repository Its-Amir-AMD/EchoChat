<?php
/**
 * EchoChat PHP Backend - Authentication & User Profile API
 */

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?? [];

switch ($action) {
    case 'register':
        handleRegister($pdo, $body);
        break;
    case 'login':
        handleLogin($pdo, $body);
        break;
    case 'users':
        handleListUsers($pdo);
        break;
    case 'profile':
        handleUpdateProfile($pdo, $body);
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid action specified']);
        break;
}

function handleRegister($pdo, $data) {
    $name = trim($data['name'] ?? '');
    $username = ltrim(trim($data['username'] ?? ''), '@');
    $phoneNumber = trim($data['phoneNumber'] ?? '');

    if (empty($name) || empty($username)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Name and username are required']);
        return;
    }

    // Check existing
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $existing = $stmt->fetch();
    if ($existing) {
        echo json_encode(['success' => true, 'user' => $existing]);
        return;
    }

    $id = 'user_' . time() . '_' . substr(md5(uniqid()), 0, 4);
    $avatar = $data['avatar'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

    $insert = $pdo->prepare("INSERT INTO users (id, name, username, phone_number, avatar, bio, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $insert->execute([$id, $name, $username, $phoneNumber, $avatar, 'کاربر تازه اکوچت ✨', 'online']);

    $user = [
        'id' => $id,
        'name' => $name,
        'username' => $username,
        'phoneNumber' => $phoneNumber,
        'avatar' => $avatar,
        'status' => 'online',
    ];

    echo json_encode(['success' => true, 'user' => $user]);
}

function handleLogin($pdo, $data) {
    $username = ltrim(trim($data['username'] ?? ''), '@');
    $phoneNumber = trim($data['phoneNumber'] ?? '');

    if (!empty($username)) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if ($user) {
            echo json_encode(['success' => true, 'user' => $user]);
            return;
        }
    }

    if (!empty($phoneNumber)) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE phone_number = ?");
        $stmt->execute([$phoneNumber]);
        $user = $stmt->fetch();
        if ($user) {
            echo json_encode(['success' => true, 'user' => $user]);
            return;
        }
    }

    // Default demo user fallback
    $stmt = $pdo->query("SELECT * FROM users LIMIT 1");
    $default = $stmt->fetch();
    echo json_encode(['success' => true, 'user' => $default ?: [
        'id' => 'user_me',
        'name' => 'امیرمحمد',
        'username' => 'amir_echo',
        'phoneNumber' => '+98 912 345 6789',
        'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        'status' => 'online'
    ]]);
}

function handleListUsers($pdo) {
    $stmt = $pdo->query("SELECT * FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll();
    echo json_encode(['success' => true, 'users' => $users]);
}

function handleUpdateProfile($pdo, $data) {
    $id = $data['id'] ?? 'user_me';
    $name = $data['name'] ?? null;
    $username = isset($data['username']) ? ltrim($data['username'], '@') : null;
    $bio = $data['bio'] ?? null;
    $status = $data['status'] ?? null;

    $fields = [];
    $params = [];

    if ($name !== null) { $fields[] = "name = ?"; $params[] = $name; }
    if ($username !== null) { $fields[] = "username = ?"; $params[] = $username; }
    if ($bio !== null) { $fields[] = "bio = ?"; $params[] = $bio; }
    if ($status !== null) { $fields[] = "status = ?"; $params[] = $status; }

    if (!empty($fields)) {
        $params[] = $id;
        $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $updated = $stmt->fetch();

    echo json_encode(['success' => true, 'user' => $updated]);
}
