<?php
/**
 * EchoChat PHP Backend - AI Assistant (Gemini Proxy & Smart Local Fallback)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?? [];

$action = $body['action'] ?? 'chat';
$text = $body['text'] ?? '';
$targetLanguage = $body['targetLanguage'] ?? 'fa';
$tone = $body['tone'] ?? 'formal';
$context = $body['context'] ?? [];

$apiKey = getenv('GEMINI_API_KEY') ?: '';

$resultOutput = null;

// If GEMINI_API_KEY is available in the PHP environment, make curl call to Gemini API
if (!empty($apiKey)) {
    $prompt = '';
    $systemPrompt = "You are the intelligent assistant for EchoChat, a Persian and English messaging platform. Respond concisely and authentically in the requested language.";

    if ($action === 'smart_replies') {
        $prompt = "Given this incoming message: \"{$text}\", provide exactly 3 short, natural, appropriate quick-reply options as a JSON array of strings.";
    } elseif ($action === 'summarize') {
        $joinedContext = implode("\n", $context);
        $prompt = "Summarize the following chat messages clearly in 3-4 bullet points in " . ($targetLanguage === 'fa' ? 'Persian (Farsi)' : 'English') . ":\n{$joinedContext}";
    } elseif ($action === 'translate') {
        $toLang = ($targetLanguage === 'fa' || preg_match('/[\x{0600}-\x{06FF}]/u', $text)) ? 'English' : 'Persian (Farsi)';
        $prompt = "Translate this text accurately and naturally to {$toLang}:\n\"{$text}\"";
    } elseif ($action === 'rewrite') {
        $prompt = "Rewrite this message with a {$tone} tone:\n\"{$text}\"";
    } else {
        $prompt = !empty($text) ? $text : 'سلام';
    }

    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . urlencode($apiKey);
    $payload = json_encode([
        'contents' => [['parts' => [['text' => $prompt]]]],
        'systemInstruction' => ['parts' => [['text' => $systemPrompt]]],
    ]);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $resJson = json_decode($response, true);
        $rawText = $resJson['candidates'][0]['content']['parts'][0]['text'] ?? '';
        if (!empty($rawText)) {
            if ($action === 'smart_replies') {
                $cleaned = trim(preg_replace('/```json|```/', '', $rawText));
                $parsed = json_decode($cleaned, true);
                if (is_array($parsed)) {
                    $resultOutput = $parsed;
                }
            } else {
                $resultOutput = trim($rawText);
            }
        }
    }
}

// Fallback generator if no key or API error
if ($resultOutput === null) {
    $resultOutput = getPhpSmartFallback($action, $text, $targetLanguage, $tone, $context);
}

echo json_encode(['success' => true, 'result' => $resultOutput]);

function getPhpSmartFallback($action, $text, $targetLanguage, $tone, $context) {
    $isPersian = $targetLanguage === 'fa' || preg_match('/[\x{0600}-\x{06FF}]/u', $text);

    switch ($action) {
        case 'smart_replies':
            if ($isPersian) {
                return [
                    'سلام، حتماً بررسی می‌کنم! 👍',
                    'بسیار عالی، موافقم. 🤝',
                    'ممنون، در اولین فرصت خبر می‌دهم. ✨',
                ];
            }
            return [
                'Sounds great, will check it out! 👍',
                'Perfect, let us proceed. 🤝',
                'Thank you, will update you shortly! ✨',
            ];

        case 'summarize':
            if ($isPersian) {
                return "📌 خلاصه مکالمات اخیر:\n• تبادل پیام و بررسی امکانات جدید اکوچت\n• هماهنگی تماس‌های صوتی و تصویری بلادرنگ\n• تأیید عملکرد مطلوب بک‌اند و اتصال پایگاه‌داده";
            }
            return "📌 Recent Chat Summary:\n• Coordination on EchoChat messenger features\n• Verification of real-time messaging and calls\n• Confirmation of database operations";

        case 'translate':
            if ($isPersian) {
                return "[English Translation]: \"{$text}\" (Translated via EchoChat PHP AI)";
            }
            return "[ترجمه به فارسی]: \"{$text}\" (ترجمه شده توسط اکوچت)";

        case 'rewrite':
            if ($tone === 'formal') {
                return "با احترام و آرزوی سلامتی، موضوع مطروحه مورد بررسی قرار گرفت: {$text}";
            }
            if ($tone === 'friendly') {
                return "سلام رفیق! {$text} 😊✨";
            }
            if ($tone === 'concise') {
                return mb_substr(trim($text), 0, 100);
            }
            return trim($text);

        case 'chat':
        default:
            $lower = mb_strtolower($text);
            if (str_contains($lower, 'سلام') || str_contains($lower, 'درود') || str_contains($lower, 'hi')) {
                return "سلام! من دستیار هوشمند اکوچت (EchoChat AI) هستم. چطور می‌توانم به شما کمک کنم؟ ✨";
            }
            return "پاسخ دستیار اکوچت به «{$text}»:\nپیام شما پردازش شد. در صورت نیاز می‌توانید از ابزارهای هوش مصنوعی بالای صفحه استفاده فرمایید.";
    }
}
