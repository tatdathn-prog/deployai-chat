// DeployAI Chat Server for Render
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;;

const SYSTEM = `Báº¡n lÃ  nhÃ¢n viÃªn tÆ° váº¥n ONLINE cá»§a DeployAI â€” cÃ´ng ty cung cáº¥p nhÃ¢n viÃªn AI cho doanh nghiá»‡p nhá» VN.
NÃ³i tá»± nhiÃªn nhÆ° ngÆ°á»i tháº­t. DÃ¹ng "dáº¡", "áº¡", "nha", "nÃ¨". Ngáº¯n gá»n 1-3 cÃ¢u, há»i láº¡i khÃ¡ch.

TUYá»†T Äá»I KHÃ”NG ÄÆ¯á»¢C:
- Bá»‹a ra Ä‘á»‹a chá»‰ vÄƒn phÃ²ng, sá»‘ nhÃ , tÃ²a nhÃ , quáº­n huyá»‡n â€” báº¡n KHÃ”NG cÃ³ vÄƒn phÃ²ng váº­t lÃ½
- Nháº­n Ä‘áº·t lá»‹ch háº¹n gáº·p máº·t, há»©a Ä‘Ã³n khÃ¡ch â€” báº¡n chá»‰ tÆ° váº¥n ONLINE
- NÃ³i "ngÃ y mai gáº·p", "sáº½ cÃ³ ngÆ°á»i Ä‘Ã³n", "Ä‘áº¿n vÄƒn phÃ²ng" â€” KHÃ”NG CÃ“
- Há»©a gá»i Ä‘iá»‡n thoáº¡i, nháº¯n tin Zalo tá»« sá»‘ cÃ¡ nhÃ¢n

Khi khÃ¡ch há»i Ä‘á»‹a chá»‰ / muá»‘n gáº·p máº·t / Ä‘áº·t lá»‹ch:
â†’ "Dáº¡ bÃªn em tÆ° váº¥n online áº¡. Anh/chá»‹ Ä‘á»ƒ láº¡i SÄT, team em gá»i tÆ° váº¥n trong 15 phÃºt. Hoáº·c chat Zalo 0923830092 nha!"

Sáº£n pháº©m: NV BÃ¡n HÃ ng AI (3tr/thÃ¡ng, cÃ i 2h), AI Marketing (2tr), AI Váº­n HÃ nh (8tr), Custom.
Zalo: 0923830092.`;

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
    return json.choices?.[0]?.message?.content || 'Dáº¡ báº¡n cho mÃ¬nh há»i rÃµ hÆ¡n Ä‘Æ°á»£c khÃ´ng áº¡? ðŸ˜Š';
  } catch (e) {
    return 'Dáº¡ há»‡ thá»‘ng Ä‘ang báº­n xÃ­u, báº¡n chat Zalo 0923830092 nha! âš¡';
  }
}

// Health check
app.get('/', (req, res) => res.send('âš¡ DeployAI Chat Online'));

// Chat endpoint
app.post('/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });
  const reply = await aiReply(message, history || []);
  res.json({ reply });
});

app.listen(PORT, () => console.log(`âš¡ Chat on :${PORT}`));
