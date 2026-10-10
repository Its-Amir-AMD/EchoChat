import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

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

// AI Assistant endpoint
app.post('/api/gemini/assistant', async (req: Request, res: Response) => {
  const { action, text, targetLanguage, tone, context } = req.body;

  if (!ai) {
    // If no API key configured, signal client to use rich local intelligence
    return res.status(200).json({
      success: false,
      message: 'GEMINI_API_KEY not set. Using local fallback.',
    });
  }

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

    // If smart replies were requested, try parsing JSON array
    if (action === 'smart_replies') {
      try {
        const cleaned = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          return res.json({ success: true, result: parsed });
        }
      } catch {
        // Fallback to lines
        const lines = resultText.split('\n').map(l => l.replace(/^[0-9.-]\s*/, '').trim()).filter(Boolean).slice(0, 3);
        if (lines.length > 0) {
          return res.json({ success: true, result: lines });
        }
      }
    }

    return res.json({ success: true, result: resultText.trim() });
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    return res.status(200).json({
      success: false,
      error: error?.message || 'AI request failed',
    });
  }
});

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EchoChat server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
