import { useState, useRef, useEffect } from 'react'
import { dbGetAll } from '../../lib/db'

export default function AIPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'مرحباً! أنا مساعذك الذكي لنظام CATALAN POS. كيف يمكنني مساعدتك؟' }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  async function sendMessage() {
    const msg = input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setIsTyping(true)

    try {
      const items = await dbGetAll('items')
      const inventory = items.map(i => `${i.name} (${i.code}): stock=${i.stock}, price=$${i.price}`).join('\n')

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a smart assistant for CATALAN POS system. Current inventory:\n${inventory}\n\nAlways reply in the same language the user writes in. Be concise and helpful.`,
          messages: [{ role: 'user', content: msg }],
        }),
      })
      const data = await res.json()
      const reply = data.content?.map(c => c.text || '').filter(Boolean).join('\n') || 'عذراً، لم أتمكن من الإجابة.'
      setMessages(prev => [...prev, { role: 'bot', text: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'عذراً، حدث خطأ في الاتصال.' }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="ai-panel">
      <div className={`ai-chat-window${isOpen ? ' open' : ''}`}>
        <div className="ai-chat-header">
          <span>🤖 المساعد الذكي</span>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>
        <div className="ai-chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`ai-msg ${m.role}`}>{m.text}</div>
          ))}
          {isTyping && (
            <div className="ai-msg bot">
              <span className="loading-spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'var(--primary)' }}></span>
              {' '}جاري البحث...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="ai-chat-input-row">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="اكتب سؤالك..."
          />
          <button className="btn btn-primary btn-sm" onClick={sendMessage}>إرسال</button>
        </div>
      </div>
      <button className="ai-fab" onClick={() => setIsOpen(o => !o)}>🤖</button>
    </div>
  )
}
