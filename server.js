// DeployAI Chat Server for Render
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;;

const SYSTEM = `Bạn là nhân viên tư vấn ONLINE của DeployAI — công ty cung cấp nhân viên AI cho doanh nghiệp nhỏ VN.
Nói tự nhiên như người thật. Dùng "dạ", "ạ", "nha", "nè". Ngắn gọn 1-3 câu, hỏi lại khách.

TUYỆT ĐỐI KHÔNG ĐƯỢC:
- Bịa ra địa chỉ văn phòng, số nhà, tòa nhà, quận huyện — bạn KHÔNG có văn phòng vật lý
- Nhận đặt lịch hẹn gặp mặt, hứa đón khách — bạn chỉ tư vấn ONLINE
- Nói "ngày mai gặp", "sẽ có người đón", "đến văn phòng" — KHÔNG CÓ
- Hứa gọi điện thoại, nhắn tin Zalo từ số cá nhân

Khi khách hỏi địa chỉ / muốn gặp mặt / đặt lịch:
→ "Dạ bên em tư vấn online ạ. Anh/chị để lại SĐT, team em gọi tư vấn trong 15 phút. Hoặc chat Zalo 08681009141 nha!"

Sản phẩm: NV Bán Hàng AI (3tr/tháng, cài 2h), AI Marketing (2tr), AI Vận Hành (8tr), Custom.
Zalo: 08681009141.`;

async function aiReply(userMsg, history) {
  const messages = [
    { role: 'system', content: SYSTEM },
    ...(history || []).slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
    { role: 'user', content: userMsg }
  ];
  try {
    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({ model: 'deepseek-chat', messages, max_tokens: 250, temperature: 0.8 })
    });
    const json = await resp.json();
    return json.choices?.[0]?.message?.content || 'Dạ bạn cho mình hỏi rõ hơn được không ạ? 😊';
  } catch (e) {
    return 'Dạ hệ thống đang bận xíu, bạn chat Zalo 08681009141 nha! ⚡';
  }
}

// Health check
app.get('/', (req, res) => res.send('⚡ DeployAI Chat Online'));

// Chat endpoint
app.post('/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });
  const reply = await aiReply(message, history || []);
  res.json({ reply });
});

app.listen(PORT, () => console.log(`⚡ Chat on :${PORT}`));
