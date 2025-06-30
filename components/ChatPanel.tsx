
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SenderType } from '../types';
import { MessageBubble } from './MessageBubble';
import { SendIcon, LoadingSpinnerIcon } from './icons';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  error: string | null;
  disabled?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isLoading, error, disabled }) => {
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMessage.trim() && !isLoading && !disabled) {
      onSendMessage(currentMessage.trim());
      setCurrentMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-800">
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-center py-2">
            <LoadingSpinnerIcon className="w-8 h-8 text-sky-400" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {error && <div className="p-3 bg-red-500 text-white text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700 bg-slate-900">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder={disabled ? "Chat disabled due to API Key issue" : "Ask a question about the sheet data..."}
            className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || disabled}
          />
          <button
            type="submit"
            disabled={isLoading || !currentMessage.trim() || disabled}
            className="p-3 bg-sky-600 text-white rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </div>
      </form>
    </div>
  );
};