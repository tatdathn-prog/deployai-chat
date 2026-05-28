// DeployAI Chat Server for Render
import express from 'express';
import cors from 'cors';
import https from 'https';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const TELEGRAM_BOT = process.env.TELEGRAM_BOT || '8896024407:AAGm6tqzf_0CJaAsm-0yjU9F1Eaji7u7EK0';
const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT || '8681009141';
const CRM_WEBHOOK = process.env.CRM_WEBHOOK || 'https://script.google.com/macros/s/AKfycby0atd0AO9SX4H1gcWE23za4QqK7qUmoYyx0a0Pc5KENtMThI4Fyx8p1yxFMjcA5_4G/exec';
const HEX_URL = process.env.HEX_URL || '';

// ── Telegram ──
function sendTelegram(text) {
  if (!TELEGRAM_BOT) return;
  return new Promise((resolve) => {
    const payload = Buffer.from(JSON.stringify({ chat_id: TELEGRAM_CHAT, text }), 'utf-8');
    const req = https.request(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>resolve()); });
    req.on('error', () => resolve());
    req.write(payload); req.end();
  });
}

// ── CRM ──
function saveCRM(data) {
  if (!CRM_WEBHOOK) return;
  try {
    const u = new URL(CRM_WEBHOOK);
    const body = JSON.stringify(data);
    const req = https.request(u, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, r => {});
    req.on('error', () => {});
    req.write(body); req.end();
  } catch(e) {}
}

// ── System Prompt ──
const SYSTEM = `Bạn là nhân viên tư vấn ONLINE của DeployAI — công ty cung cấp nhân viên AI 24/7 cho doanh nghiệp Việt.

CÁCH NÓI CHUYỆN:
- Tự nhiên như người thật, dùng "dạ", "ạ", "nha", "nè", "luôn"
- Ngắn gọn 1-3 câu, hỏi lại khách để hiểu nhu cầu
- TUYỆT ĐỐI KHÔNG: markdown (**), bullet point, đánh số 1.2.3., in đậm

VỀ GIÁ CẢ — QUAN TRỌNG NHẤT:
- TUYỆT ĐỐI KHÔNG ĐƯA RA BẤT KỲ CON SỐ TIỀN NÀO
- Nếu khách hỏi "bao nhiêu tiền", "giá bao nhiêu", "mấy triệu" → LUÔN trả lời: "Dạ bên em báo giá theo nhu cầu cụ thể ạ. Anh/chị để lại SĐT team em gọi tư vấn miễn phí trong 15 phút nha!"
- KHÔNG nói "3 triệu", "2 triệu", "8 triệu", "12 triệu" hay bất kỳ con số nào

SẢN PHẨM (mô tả, không giá):
- NV Bán Hàng AI: trả lời FB/Zalo/Web 24/7, tư vấn sản phẩm, ghi đơn, báo cáo
- AI Marketing: viết content, email marketing, SEO
- AI Vận Hành: cho KS/nhà hàng/du lịch — tư vấn phòng, check lịch, đa ngôn ngữ
- Custom: thiết kế AI riêng theo quy trình doanh nghiệp
- Triển khai 2-3h, dùng thử 7 ngày free, không cần thẻ

KHI KHÁCH ĐỂ LẠI SĐT: "Dạ em cảm ơn! Team sẽ gọi lại trong 15 phút ạ 🙏"
Zalo hỗ trợ: 0923830092 | Web: deployai.vn`;

// ── AI Reply ──
async function aiReply(userMsg, history) {
  const messages = [
    { role: 'system', content: SYSTEM },
    ...(history || []).slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
    { role: 'user', content: userMsg }
  ];
  try {
    let reply = '';
    
    // Try Hex Qwen first (FREE), fallback to DeepSeek
    if (HEX_URL) {
      try {
        const prompt = `${SYSTEM}\n\nLịch sử:\n${messages.slice(1).map(m => `${m.role==='user'?'Khách':'Bolt'}: ${m.content}`).join('\n')}\nKhách: ${userMsg}\nBolt:`;
        const resp = await fetch(HEX_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, max_length: 400, temperature: 0.7, top_p: 0.9 }),
          signal: AbortSignal.timeout(8000)
        });
        const json = await resp.json();
        reply = json.results?.[0]?.text?.trim() || '';
        reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '');
        reply = reply.replace(/^[\s\n]*(Here's|Let me|Okay|I need|First|Now).*?\n/gi, '');
      } catch(e) {
        console.log('Hex failed, trying DeepSeek...');
      }
    }
    
    // Fallback to DeepSeek
    if (!reply && DEEPSEEK_KEY) {
      const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
        body: JSON.stringify({ model: 'deepseek-chat', messages, max_tokens: 400, temperature: 0.8 })
      });
      const json = await resp.json();
      reply = json.choices?.[0]?.message?.content || '';
    }
    
    // Strip markdown
    reply = reply.replace(/\*\*/g, '');
    reply = reply.replace(/^\d+\.\s*/gm, '');
    reply = reply.trim();
    
    // Price filter: if any price-like patterns detected, override
    if (/\d[\d.]*\s*(triệu|tr|nghìn|k|VND|đồng)/i.test(reply) || /\d{1,3}(?:\.\d{3}){2,}/.test(reply)) {
      reply = 'Dạ bên em báo giá theo nhu cầu cụ thể của từng doanh nghiệp ạ. Anh/chị để lại SĐT hoặc nhắn Zalo 0923830092 để team em gọi tư vấn miễn phí và gửi báo giá riêng nha!';
    }
    
    if (reply.length > 400) reply = reply.substring(0, 400).replace(/\s+\S*$/, '');
    
    return reply || 'Dạ anh/chị cho em hỏi thêm về nhu cầu để tư vấn kỹ hơn ạ?';
  } catch (e) {
    console.error('AI error:', e.message);
    return 'Dạ hệ thống đang bận xíu, anh/chị nhắn Zalo 0923830092 để được tư vấn nhanh nha! ⚡';
  }
}

// ── Routes ──
app.get('/', (req, res) => res.send('⚡ DeployAI Chat Online v2'));

app.post('/chat', async (req, res) => {
  const { message, history, name, phone } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });
  
  // Detect lead: phone number or email
  const hasPhone = phone || /0\d{8,10}/.test(message);
  const hasEmail = message.includes('@');
  const isLead = hasPhone || hasEmail;
  
  if (isLead) {
    // Save to CRM + notify Telegram
    const leadData = {
      name: name || 'Khách web',
      phone: phone || (message.match(/0\d{8,10}/) || [''])[0],
      email: hasEmail ? message : '',
      message: message.slice(0, 500),
      source: 'Website Chat',
      sessionId: Date.now().toString(36)
    };
    saveCRM(leadData);
    sendTelegram(`<b>💬 Lead Mới Từ Website!</b>\n👤 ${leadData.name}\n📱 ${leadData.phone}\n💬 "${message.slice(0, 200)}"`);
  }
  
  const reply = await aiReply(message, history || []);
  res.json({ reply });
});

app.listen(PORT, () => console.log(`⚡ Chat server on :${PORT}`));
