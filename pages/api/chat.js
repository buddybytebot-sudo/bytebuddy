// ✅ Import Supabase
import { createClient } from '@supabase/supabase-js';

// ✅ Initialize Supabase client securely (Server key used only in backend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // ✅ Only allow POST requests
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, conversationId, message } = req.body;

  // ✅ Basic validation
  if (!userId || !conversationId || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // ✅ Save user message into "memories"
    const { error: insertUserError } = await supabase.from('memories').insert([{
      user_id: userId,
      conversation_id: conversationId,
      role: 'user',
      content: message
    }]);

    if (insertUserError) throw insertUserError;

    // ✅ Get recent context (last 10 messages)
    const { data: past, error: selectError } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (selectError) throw selectError;

    const context = past?.map(x => `${x.role}: ${x.content}`).join('\n') || '';

    // ✅ Call Google AI API (Gemini or whatever model endpoint you set)
    const response = await fetch(process.env.GOOGLE_AI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GOOGLE_AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${context}\nUser: ${message}\nAssistant:` }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    // ✅ Extract assistant reply safely
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.output_text ||
      'No response';

    // ✅ Save assistant reply into "memories"
    const { error: insertAssistantError } = await supabase.from('memories').insert([{
      user_id: userId,
      conversation_id: conversationId,
      role: 'assistant',
      content: reply
    }]);

    if (insertAssistantError) throw insertAssistantError;

    // ✅ Respond to frontend
    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
