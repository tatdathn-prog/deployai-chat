#!/usr/bin/env node
const http = require('http');
const https = require('https');
const TELEGRAM_TOKEN = '889602…7EK0';
const TELEGRAM_CHAT = '8681009141';
const DEEPSEEK_KEY = 'sk-placeholder';
const USE_LOCAL_AI = true; // Use Hex Qwen 27B (free, local) instead of DeepSeek
const HEX_URL = 'http://192.168.178.48:5001/api/v1/generate';
const PORT = 3457;
const sessions = {};

function sendTelegram(text) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' });
    const req = https.request(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }
    }, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve(JSON.parse(d))); });
    req.on('error', () => resolve({ ok: false }));
    req.write(body); req.end();
  });
}

async function aiReply(userMsg, history) {
  const system = `Bạn là nhân viên tư vấn của DeployAI — công ty cung cấp nhân viên AI cho doanh nghiệp nhỏ VN.

CÁCH NÓI CHUYỆN:
- Nói tự nhiên như người thật, không như robot
- Dùng tiếng Việt đời thường: "dạ", "ạ", "nha", "nè", "luôn"
- Ngắn gọn, 1-3 câu, không dài dòng
- Hỏi lại khách để hiểu rõ nhu cầu
- KHÔNG DÙNG: dấu sao **, bullet point, danh sách dài, emoji thái quá

KIẾN THỨC:
- NV Bán Hàng AI: 3tr/tháng, trả lời FB/Zalo 24/7, tư vấn SP, ghi đơn, CRM
- Nâng cấp: AI Marketing (2tr), AI Vận Hành KS/nhà hàng (8tr), Custom
- Cài trong 2 tiếng, dùng thử 7 ngày
- Zalo hỗ trợ: 08681009141

QUAN TRỌNG: Trả lời như 1 con người đang chat. Không kịch bản. Không máy móc.`;

  const context = history.slice(-5).map(m => `${m.role==='customer'?'Khách':'Bolt'}: ${m.text}`).join('\n');
  const prompt = `${system}\n\nLịch sử chat:\n${context}\nKhách: ${userMsg}\nBolt:`;

  try {
    let reply;
    if (USE_LOCAL_AI) {
      // Use Hex Qwen 27B (FREE, local)
      const resp = await fetch(HEX_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, max_length: 250, temperature: 0.7, top_p: 0.9 })
      });
      const json = await resp.json();
      reply = json.results?.[0]?.text?.trim() || '';
      // Aggressive cleanup: remove all thinking/reasoning artifacts
      reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '');
      reply = reply.replace(/Here's a thinking process[\s\S]*?(?=\n\n|\n[A-ZĂÂÊÔƠƯĐ])/gi, '');
      reply = reply.replace(/^(.*thinking.*|.*analyze.*|.*process.*|.*context.*|.*role.*)\n/gi, '');
      reply = reply.replace(/\n\d+\.\s\*\*[^*]+\*\*[\s\S]*?(?=\n\n|$)/g, '');
      reply = reply.replace(/^[\s\n]*[-•]\s.*$/gm, '');
      reply = reply.replace(/\n{3,}/g, '\n\n');
      reply = reply.trim();
    } else {
      // Use DeepSeek
      const body = JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: system }, ...history.map(m => ({ role: m.role === 'customer' ? 'user' : 'assistant', content: m.text })), { role: 'user', content: userMsg }], max_tokens: 300, temperature: 0.7 });
      const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` }, body
      });
      const json = await resp.json();
      reply = json.choices?.[0]?.message?.content || '';
    }
    return reply || 'Mình chưa hiểu ý bạn lắm. Bạn hỏi về giá, tính năng hay cách dùng DeployAI vậy ạ? 😊';
  } catch(e) {
    console.error('AI error:', e.message);
    return 'Mình đang lỗi kỹ thuật xíu. Bạn chat Zalo 08681009141 để mình tư vấn nhanh nhé! ⚡';
  }
}

const server = http.createServer(async (req, res) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (req.method === 'OPTIONS') { res.writeHead(200, headers); res.end(); return; }

  // POST /chat
  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { name, phone, message, sessionId } = JSON.parse(body);
        const sid = sessionId || 'default';
        if (!sessions[sid]) sessions[sid] = [];
        sessions[sid].push({ role: 'customer', text: message, time: Date.now() });

        // Forward to Telegram
        sendTelegram(`💬 <b>Chat Web</b>\n👤 ${name||'?'}\n📱 ${phone||'?'}\n💬 "${message}"`);

        // AI reply async
        const history = sessions[sid].slice(-10);
        aiReply(message, history).then(reply => {
          sessions[sid].push({ role: 'bot', text: reply, time: Date.now() });
        });

        res.writeHead(200, { ...headers, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch(e) {
        res.writeHead(500, { ...headers });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // GET /messages?sessionId=X&after=TIME
  if (req.method === 'GET' && req.url.startsWith('/messages')) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const sid = url.searchParams.get('sessionId') || 'default';
    const after = parseInt(url.searchParams.get('after') || '0');
    const msgs = (sessions[sid] || []).filter(m => m.time > after);
    res.writeHead(200, { ...headers, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ messages: msgs, lastTime: Date.now() }));
    return;
  }

  res.writeHead(200, { ...headers, 'Content-Type': 'text/html' });
  res.end('<h1>DeployAI Chat ⚡</h1>');
});

server.listen(PORT, '0.0.0.0', () => console.log(`⚡ Chat server on :${PORT}`));
