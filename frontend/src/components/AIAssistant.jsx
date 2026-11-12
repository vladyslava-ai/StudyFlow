import { useState } from 'react';
import { api } from '../lib/api.js';
import './AIAssistant.css';

export default function AIAssistant() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendMessage(event) {
    event.preventDefault();

    const question = message.trim();
    if (!question || loading) return;

    setMessages((previous) => [
      ...previous,
      { role: 'user', text: question }
    ]);

    setMessage('');
    setError('');
    setLoading(true);

    try {
      const result = await api.aiChat(question);

      setMessages((previous) => [
        ...previous,
        { role: 'assistant', text: result.answer }
      ]);
    } catch (err) {
      setError(err.message || 'Не вдалося отримати відповідь.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="ai-assistant">
      <div className="ai-intro">
        <div className="ai-symbol"></div>
        <h2>Твій інтелектуальний помічник</h2>
        <p>
          Став запитання, розбирай складні теми та навчайся
          разом зі StudyFlow AI.
        </p>
      </div>

      <div className="ai-conversation" aria-live="polite">
        {messages.length === 0 && (
          <div className="ai-empty">
            <span></span>
            <h3>З чого почнемо?</h3>
            <p>Напиши запитання, і я допоможу розібратися.</p>
          </div>
        )}

        {messages.map((item, index) => (
          <div
            key={index}
            className={`ai-message ${item.role}`}
          >
            <span className="ai-message-label">
              {item.role === 'user' ? 'Ти' : 'StudyFlow AI'}
            </span>
            <div className="ai-message-text">{item.text}</div>
          </div>
        ))}

        {loading && (
          <div className="ai-message assistant">
            <span className="ai-message-label">StudyFlow AI</span>
            <div className="ai-typing">Готую відповідь...</div>
          </div>
        )}
      </div>

      {error && <p className="ai-error" role="alert">{error}</p>}

      <form className="ai-form" onSubmit={sendMessage}>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Постав запитання..."
          maxLength={2000}
          rows={3}
          disabled={loading}
          aria-label="Запитання для AI"
        />

        <button type="submit" disabled={loading || !message.trim()}>
          {loading ? 'Зачекай...' : 'Надіслати '}
        </button>
      </form>

      <p className="ai-disclaimer">
        Відповіді AI можуть містити неточності. Перевіряй важливу інформацію.
      </p>
    </section>
  );
}
