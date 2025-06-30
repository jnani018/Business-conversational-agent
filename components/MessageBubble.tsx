
import React from 'react';
import { ChatMessage, SenderType } from '../types';
import { UserIcon, BotIcon } from './icons';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === SenderType.USER;
  const bubbleClasses = isUser 
    ? 'bg-sky-600 text-white self-end' 
    : 'bg-slate-700 text-slate-100 self-start';
  const alignmentClasses = isUser ? 'items-end' : 'items-start';

  const formatTimestamp = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return ''; 
    }
  };
  
  // Basic markdown-like link detection and rendering
  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">{part}</a>;
      }
      return part;
    });
  };


  return (
    <div className={`flex flex-col ${alignmentClasses} w-full`}>
      <div className={`flex items-start space-x-2 max-w-xl ${isUser ? 'ml-auto flex-row-reverse space-x-reverse' : 'mr-auto'}`}>
        <div className={`flex-shrink-0 p-2 rounded-full ${isUser ? 'bg-sky-700' : 'bg-slate-600'}`}>
          {isUser ? <UserIcon className="w-5 h-5 text-white" /> : <BotIcon className="w-5 h-5 text-sky-400" />}
        </div>
        <div className={`px-4 py-3 rounded-lg shadow ${bubbleClasses} break-words`}>
          <p className="whitespace-pre-wrap">{renderTextWithLinks(message.text)}</p>
        </div>
      </div>
      <p className={`text-xs text-slate-500 mt-1 ${isUser ? 'text-right' : 'text-left'} px-10`}>
        {formatTimestamp(message.timestamp)}
      </p>
    </div>
  );
};