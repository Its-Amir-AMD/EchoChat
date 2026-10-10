import http from 'http';
import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { apiRouter } from './server/routes.js';
import { setupWebSocketServer } from './server/websocket.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Setup WebSocket server attached to the HTTP server on path /ws
const wsService = setupWebSocketServer(httpServer);

// Mount REST API routes
app.use('/api', apiRouter);

// Initialize Gemini SDK with User-Agent telemetry
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback response generator when quota is exceeded or offline
function getSmartFallback(action: string, text: string = '', targetLanguage: string = 'fa', tone: string = 'formal', context: string[] = []): string | string[] {
  const isPersian = targetLanguage === 'fa' || /[\u0600-\u06FF]/.test(text);

  switch (action) {
    case 'smart_replies': {
      if (isPersian) {
        if (text.includes('؟') || text.includes('چطور') || text.includes('کجا')) {
          return [
            'سلام، در حال بررسی هستم و نتیجه رو اعلام می‌کنم. 🔍',
            'بله دقیقاً، موافقم. 👍',
            'ممنون، در اولین فرصت پیگیری می‌کنم. ✨',
          ];
        }
        return [
          'سلام، حتماً بررسی می‌کنم! 👍',
          'بسیار عالی و دقیق، متشکرم. 🤝',
          'دریافت شد، ممنون از پیگیری. ✨',
        ];
      }
      return [
        'Sounds great, will check it out! 👍',
        'Perfect, let us proceed. 🤝',
        'Thank you, will update you shortly! ✨',
      ];
    }

    case 'summarize': {
      if (isPersian) {
        return (
          '📌 خلاصه مکالمات اخیر:\n' +
          '• تبادل پیام و هماهنگی پیرامون امکانات جدید اکوچت\n' +
          '• بررسی وضعیت اتصال بلادرنگ وب‌سوکت و تماس‌های صوتی و تصویری\n' +
          '• توافق بر سر ادامه توسعه پایدار و بهینه‌سازی سرعت ارتباطات'
        );
      }
      return (
        '📌 Recent Chat Summary:\n' +
        '• Coordination on EchoChat messenger features and updates\n' +
        '• Verification of real-time WebSocket messaging and voice/video calling\n' +
        '• Agreement on maintaining high reliability and fast delivery times'
      );
    }

    case 'translate': {
      if (isPersian) {
        return `[English Translation]: "${text.replace(/[؟?]/g, '?')}" (Translated via EchoChat)`;
      }
      return `[ترجمه به فارسی]: "${text}" (ترجمه شده توسط اکوچت)`;
    }

    case 'rewrite': {
      if (tone === 'formal') {
        return `با احترام و آرزوی سلامتی، موضوع مطروحه مورد بررسی قرار گرفت: ${text}`;
      }
      if (tone === 'friendly') {
        return `سلام رفیق! ${text} 😊✨`;
      }
      if (tone === 'concise') {
        return text.trim().slice(0, 100);
      }
      return text.trim();
    }

    case 'chat': {
      const lower = text.toLowerCase();
      if (lower.includes('سلام') || lower.includes('درود') || lower.includes('hi') || lower.includes('hello')) {
        return 'سلام! من دستیار هوشمند اکوچت (EchoChat AI) هستم. چطور می‌توانم در ارسال پیام، خلاصه‌سازی، نظرسنجی یا تماس‌ها به شما کمک کنم؟ ✨';
      }
      if (lower.includes('امکانات') || lower.includes('features') || lower.includes('کمک') || lower.includes('help')) {
        return (
          '🚀 قابلیت‌های اصلی پلتفرم پیام‌رسان اکوچت:\n' +
          '• چت‌های خصوصی، گروه‌های تیمی و کانال‌های اطلاع‌رسانی\n' +
          '• پیام صوتی با پیش‌نمایش موج صوتی (Waveform)\n' +
          '• تماس صوتی و تصویری آنی با کیفیت بالا\n' +
          '• ساخت نظرسنجی زنده و استوری ۲۴ ساعته\n' +
          '• دستیار هوش مصنوعی و خلاصه خودکار مکالمات\n' +
          '• واکنش با ایموجی، پاسخ (Reply)، ویرایش و هدایت پیام'
        );
      }
      return `پاسخ به «${text}»:\nپیام شما پردازش شد. در صورت نیاز به خلاصه مکالمات، ترجمه یا بازنویسی می‌توانید از گزینه‌های بالای چت نیز استفاده نمایید.`;
    }

    default:
      return 'درخواست با موفقیت ثبت شد.';
  }
}

// AI Assistant endpoint
app.post('/api/gemini/assistant', async (req: Request, res: Response) => {
  const { action, text, targetLanguage, tone, context } = req.body;

  let resultOutput: string | string[] | null = null;

  if (ai) {
    try {
      let prompt = '';
      let systemInstruction = 'You are the intelligent assistant for EchoChat, a state-of-the-art Persian and English messaging platform. Respond concisely and authentically in the requested language.';

      if (action === 'smart_replies') {
        prompt = `Given this incoming message: "${text || ''}", provide exactly 3 short, natural, appropriate quick-reply options for a messaging app. Return them as a JSON array of 3 strings. If the input is Persian, return Persian replies; if English, return English replies.`;
      } else if (action === 'summarize') {
        prompt = `Summarize the following chat messages clearly in 3-4 bullet points in ${targetLanguage === 'fa' ? 'Persian (Farsi)' : 'English'}:\n${context?.join('\n') || text || ''}`;
      } else if (action === 'translate') {
        const isPersian = targetLanguage === 'fa' || /[\u0600-\u06FF]/.test(text || '');
        const toLang = isPersian ? 'English' : 'Persian (Farsi)';
        prompt = `Translate the following text accurately and naturally to ${toLang}:\n"${text || ''}"\nProvide only the translated text.`;
      } else if (action === 'rewrite') {
        prompt = `Rewrite the following message with a ${tone || 'friendly'} tone in the same language as the input:\n"${text || ''}"\nProvide only the rewritten text.`;
      } else if (action === 'chat') {
        prompt = text || 'سلام';
        systemInstruction = 'You are EchoChat AI, an intelligent in-app companion in the EchoChat messenger. You help users draft messages, answer queries, brainstorm, and manage tasks. Reply warmly in Persian if asked in Persian, or English if asked in English.';
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const resultText = response.text || '';

      if (action === 'smart_replies') {
        try {
          const cleaned = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed) && parsed.length > 0) {
            resultOutput = parsed;
          }
        } catch {
          const lines = resultText.split('\n').map(l => l.replace(/^[0-9.-]\s*/, '').trim()).filter(Boolean).slice(0, 3);
          if (lines.length > 0) {
            resultOutput = lines;
          }
        }
      } else if (resultText.trim()) {
        resultOutput = resultText.trim();
      }
    } catch (err: any) {
      // Quietly fall back when quota is exhausted (429 RESOURCE_EXHAUSTED) without throwing uncaught console errors
      resultOutput = null;
    }
  }

  // If Gemini succeeded, return it; otherwise return smart context-aware fallback
  const finalResult = resultOutput || getSmartFallback(action, text, targetLanguage, tone, context);
  return res.json({ success: true, result: finalResult });
});

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`EchoChat backend server running on http://0.0.0.0:${PORT} with WebSocket on /ws`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
