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
async function saveCRM(data) {
  if (!CRM_WEBHOOK) return console.log('CRM: no webhook URL');
  try {
    console.log('CRM: saving', data.phone || data.name);
    const resp = await fetch(CRM_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const text = await resp.text();
    console.log('CRM: response', resp.status, text);
  } catch(e) {
    console.error('CRM: error', e.message);
  }
}

// ── System Prompt ──
const SYSTEM = `Bạn là chuyên viên tư vấn AI của DeployAI — công ty cung cấp nhân viên AI 24/7 cho doanh nghiệp Việt Nam.

VAI TRÒ CỦA BẠN:
- Tư vấn CHI TIẾT về sản phẩm, cách hoạt động, lợi ích của AI cho doanh nghiệp
- Giải thích rõ ràng AI có thể giúp gì cho ngành của khách (bán lẻ, du lịch, nhà hàng, dịch vụ...)
- Mô tả tính năng, quy trình triển khai, thời gian setup, chính sách dùng thử
- Hỏi thêm về ngành nghề, quy mô để tư vấn giải pháp phù hợp nhất

CÁCH NÓI CHUYỆN:
- Đi thẳng vào nội dung, không dùng câu mở đầu kiểu "Dạ câu hỏi rất hay", "Để em giải thích"
- Ngắn gọn, dễ đọc, tách ý bằng gạch đầu dòng (-)
- Dùng "dạ", "ạ", "nha", "nè" tự nhiên
- Nếu ý chưa hết, phải viết tiếp cho đủ — không được cắt ngang giữa chừng
- Tuyệt đối không dùng markdown (**), không in đậm, không số thứ tự 1.2.3.
- Có thể dùng gạch đầu dòng (-) để liệt kê ý cho dễ đọc

SẢN PHẨM — MÔ TẢ THOẢI MÁI:
1. NV Bán Hàng AI: Trả lời tin nhắn Facebook/Zalo/Website 24/7, tư vấn sản phẩm (giá, size, màu, tồn kho), tự động ghi đơn vào Google Sheets, follow-up khách cũ, báo cáo doanh thu mỗi tối. Phù hợp shop online, cửa hàng bán lẻ.
2. AI Marketing & Content: Viết bài Facebook/SEO, soạn email marketing cá nhân hóa, lên lịch đăng bài tự động. Tiết kiệm 10h/tuần cho chủ doanh nghiệp.
3. AI Vận Hành Dịch Vụ: Cho khách sạn, nhà hàng, homestay, du lịch. Tư vấn phòng/tour, check lịch trống real-time, nhận booking, nhắc check-in, hỗ trợ 4 ngôn ngữ (Việt, Anh, Trung, Hàn).
4. Custom AI Workflow: Thiết kế AI Agent theo quy trình riêng của doanh nghiệp. Tích hợp ERP, CRM, kế toán, kho hàng.

THÔNG TIN CHUNG:
- Triển khai kỹ thuật: 2-4h để kết nối AI vào Fanpage/Zalo/Web
- Thời gian thực chiến: tùy quy mô — shop nhỏ 1-2 ngày, doanh nghiệp lớn 1-2 tuần để huấn luyện AI hiểu hết sản phẩm & quy trình
- Dùng thử 7 ngày miễn phí, không cần thẻ tín dụng

QUAN TRỌNG VỀ GIÁ:
- TUYỆT ĐỐI KHÔNG nói bất kỳ con số tiền nào (không triệu, không nghìn, không VND)
- Nếu khách HỎI giá → trả lời: "Dạ bên em báo giá theo nhu cầu cụ thể của từng doanh nghiệp ạ. Anh/chị để lại SĐT để team em gọi tư vấn miễn phí và gửi báo giá riêng trong 15 phút nha!"
- Chỉ xin SĐT khi khách HỎI về giá. Còn lại tập trung tư vấn sản phẩm.
- KHÔNG gợi ý khách liên hệ Zalo. Chỉ xin SĐT.

KHI KHÁCH ĐỂ LẠI SĐT: "Dạ em cảm ơn! Team sẽ gọi lại trong 15 phút để tư vấn chi tiết ạ 🙏"`;

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
        body: JSON.stringify({ model: 'deepseek-chat', messages, max_tokens: 600, temperature: 0.8 })
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
    
    
    return reply || 'Dạ anh/chị cho em hỏi thêm về nhu cầu để tư vấn kỹ hơn ạ?';
  } catch (e) {
    console.error('AI error:', e.message);
    return 'Dạ hệ thống đang bận xíu, anh/chị nhắn Zalo 0923830092 để được tư vấn nhanh nha! ⚡';
  }
}

// ── Routes ──
app.get('/', (req, res) => res.send('⚡ DeployAI Chat Online v3'));

app.post('/chat', async (req, res) => {
  const { message, history, name, phone, sessionId } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });
  
  // Detect lead: phone number or email
  const hasPhone = phone || /0\d{8,10}/.test(message);
  const hasEmail = message.includes('@');
  const isLead = hasPhone || hasEmail;
  
  // Always save conversation to CRM for daily stats
  const convData = {
    name: name || 'Khách web',
    phone: phone || (hasPhone ? (message.match(/0\d{8,10}/) || [''])[0] : ''),
    email: hasEmail ? message : '',
    message: message.slice(0, 500),
    source: 'Website Chat',
    sessionId: sessionId || Date.now().toString(36)
  };
  await saveCRM(convData);
  
  if (isLead) {
    sendTelegram(`<b>💬 Lead Mới!</b>\n👤 ${convData.name}\n📱 ${convData.phone}\n💬 "${message.slice(0, 200)}"`);
  }
  
  const reply = await aiReply(message, history || []);
  res.json({ reply });
});

app.listen(PORT, () => console.log(`⚡ Chat server on :${PORT}`));
