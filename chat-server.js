#!/usr/bin/env node
const http = require('http');
const https = require('https');
const TELEGRAM_TOKEN = '889602…7EK0';
const TELEGRAM_CHAT = '8681009141';
const DEEPSEEK_KEY = 'sk-placeholder';
const USE_LOCAL_AI = true;
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
  const system = `Bạn là nhân viên tư vấn của DeployAI — công ty cung cấp nhân viên AI 24/7 cho doanh nghiệp Việt Nam.

CÁCH NÓI CHUYỆN:
- Nói tự nhiên như người thật, không như robot
- Dùng tiếng Việt đời thường: "dạ", "ạ", "nha", "nè", "luôn"
- 1-3 câu, ngắn gọn, không dài dòng
- Hỏi lại khách để hiểu rõ nhu cầu
- Nếu khách hỏi giá → nói "bên em báo giá theo nhu cầu cụ thể, anh/chị để lại SĐT em tư vấn miễn phí nha"
- KHÔNG đưa ra con số cụ thể về giá
- KHÔNG DÙNG: dấu sao **, bullet point dài, emoji thái quá, markdown

KIẾN THỨC:
- NV Bán Hàng AI: trả lời FB/Zalo 24/7, tư vấn SP, ghi đơn, CRM, báo cáo doanh thu
- AI Marketing & Content: viết bài FB, email marketing, mô tả SP chuẩn SEO
- AI Vận Hành Dịch Vụ: cho KS, nhà hàng, du lịch — tư vấn phòng/tour, check lịch, đa ngôn ngữ
- Custom AI Workflow: thiết kế AI riêng theo quy trình doanh nghiệp
- Triển khai trong 2-3 giờ, dùng thử 7 ngày miễn phí, không cần thẻ tín dụng
- Liên hệ qua Zalo: 0923830092
- Website: deployai.vn

QUAN TRỌNG: 
- Trả lời như 1 con người đang chat. Không kịch bản. Không máy móc.
- Khi khách hỏi về giá → luôn mời để lại SĐT để được tư vấn báo giá riêng
- Khi khách để lại SĐT → cảm ơn và nói sẽ gọi lại trong 15 phút
- TUYỆT ĐỐI KHÔNG ĐƯA RA GIÁ CỤ THỂ`;

  const context = history.slice(-5).map(m => `${m.role==='customer'?'Khách':'Bolt'}: ${m.text}`).join('\n');
  const prompt = `${system}\n\nLịch sử chat:\n${context}\nKhách: ${userMsg}\nBolt:`;

  try {
    let reply;
    if (USE_LOCAL_AI) {
      const resp = await fetch(HEX_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, max_length: 250, temperature: 0.7, top_p: 0.9 })
      });
      const json = await resp.json();
      reply = json.results?.[0]?.text?.trim() || '';
      reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '');
      reply = reply.replace(/Here's a thinking process[\s\S]*?(?=\n\n|\n[A-ZĂÂÊÔƠƯĐ])/gi, '');
      reply = reply.replace(/^(.*thinking.*|.*analyze.*|.*process.*|.*context.*|.*role.*)\n/gi, '');
      reply = reply.replace(/\n\d+\.\s\*\*[^*]+\*\*[\s\S]*?(?=\n\n|$)/g, '');
      reply = reply.replace(/^[\s\n]*[-•]\s.*$/gm, '');
      reply = reply.replace(/\n{3,}/g, '\n\n');
      reply = reply.trim();
    } else {
      const body = JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: system }, ...history.map(m => ({ role: m.role === 'customer' ? 'user' : 'assistant', content: m.text })), { role: 'user', content: userMsg }], max_tokens: 300, temperature: 0.7 });
      const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` }, body
      });
      const json = await resp.json();
      reply = json.choices?.[0]?.message?.content || '';
    }
    return reply || 'Mình chưa hiểu ý bạn lắm. Bạn muốn tư vấn về giải pháp AI cho lĩnh vực nào ạ?';
  } catch(e) {
    console.error('AI error:', e.message);
    return 'Mình đang lỗi kỹ thuật xíu. Bạn nhắn Zalo 0923830092 để mình tư vấn nhanh nhé! ⚡';
  }
}

const server = http.createServer(async (req, res) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (req.method === 'OPTIONS') { res.writeHead(200, headers); res.end(); return; }

  // POST /chat — now returns reply directly (sync)
  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { name, phone, message, history } = JSON.parse(body);
        const sid = (phone || name || 'web').toString().slice(0,20);
        if (!sessions[sid]) sessions[sid] = [];
        
        const userMsg = message || '';
        sessions[sid].push({ role: 'customer', text: userMsg, time: Date.now() });

        // Notify Telegram for lead capture
        if (phone || (userMsg && (userMsg.match(/0\d{8,10}/) || userMsg.includes('@')))) {
          sendTelegram(`💬 <b>Chat Web — Lead Mới!</b>\n👤 ${name||'Khách web'}\n📱 ${phone||'(xem tin nhắn)'}\n💬 "${userMsg.slice(0,200)}"`);
        }

        // Get AI reply synchronously
        const chatHistory = (history || sessions[sid].slice(-10)).map(m => ({ role: m.role, text: m.text }));
        const reply = await aiReply(userMsg, chatHistory);
        
        sessions[sid].push({ role: 'bot', text: reply, time: Date.now() });

        res.writeHead(200, { ...headers, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply }));
      } catch(e) {
        res.writeHead(200, { ...headers });
        res.end(JSON.stringify({ reply: 'Lỗi kỹ thuật, bạn nhắn Zalo 0923830092 nha! ⚡' }));
      }
    });
    return;
  }

  res.writeHead(200, { ...headers, 'Content-Type': 'text/html' });
  res.end('<h1>DeployAI Chat ⚡</h1>');
});

server.listen(PORT, '0.0.0.0', () => console.log(`⚡ Chat server on :${PORT}`));
