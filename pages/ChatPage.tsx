
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { geminiService } from '../services/geminiService';
import { SendIcon, ByteBuddyLogo } from '../components/ui/Icons';
import { GenerateContentResponse } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  loading: boolean;
  placeholder: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ input, setInput, handleSendMessage, loading, placeholder }) => (
  <div className="px-4 pb-4 w-full max-w-3xl mx-auto">
      <form onSubmit={handleSendMessage} className="relative flex items-center">
      <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
          }
          }}
          placeholder={placeholder}
          rows={1}
          className="w-full bg-card/80 rounded-full py-3 pl-5 pr-14 text-text-primary text-lg resize-none placeholder-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <button type="submit" disabled={loading || !input.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-white bg-gradient-to-r from-primary to-secondary disabled:opacity-50 disabled:from-gray-600 disabled:to-gray-700 hover:opacity-90 transition-all">
          <SendIcon className="w-5 h-5" />
      </button>
      </form>
  </div>
);

const ChatPage: React.FC = () => {
  const { id: conversationId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { conversations, messages, addMessage, addConversation, updateConversationTitle } = useChat();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentMessages = conversationId ? messages[conversationId] || [] : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !user) return;

    let currentConvId = conversationId;
    let isNewConversation = !currentConvId;

    if (isNewConversation) {
      const newConv = await addConversation();
      currentConvId = newConv.id;
      // Navigate to the new chat URL, but replace the history entry
      // so the user doesn't have to click "back" through an empty page.
      navigate(`/chat/${newConv.id}`, { replace: true });
    }

    if (!currentConvId) return;

    const userMessage: Omit<Message, 'id' | 'created_at'> = {
      conversation_id: currentConvId,
      content: input,
      role: 'user',
    };
    
    const currentInput = input;
    setInput('');
    const addedUserMessage = await addMessage(userMessage);
    setLoading(true);

    try {
        const tempMessages = [...currentMessages, addedUserMessage];
        const response: GenerateContentResponse = await geminiService.getChatResponse(tempMessages, userProfile);
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources = groundingChunks
            ?.map(chunk => chunk.web)
            .filter((web): web is { uri: string; title: string } => !!(web?.uri && web?.title));


        const assistantMessage: Omit<Message, 'id' | 'created_at'> = {
            conversation_id: currentConvId,
            content: response.text,
            role: 'assistant',
            sources,
        };

        await addMessage(assistantMessage);

        if (isNewConversation) {
            const title = await geminiService.generateTitle(currentInput);
            await updateConversationTitle(currentConvId, title);
        }
    } catch (error) {
        console.error('Error getting response from Gemini:', error);
        const errorMessage: Omit<Message, 'id' | 'created_at'> = {
            conversation_id: currentConvId,
            content: 'Sorry, I encountered an error. Please try again.',
            role: 'assistant',
        };
        await addMessage(errorMessage);
    } finally {
        setLoading(false);
    }
  };


  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentMessages.length > 0 ? (
          currentMessages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl p-4 rounded-2xl ${message.role === 'user' ? 'bg-primary text-white' : 'bg-card'}`}>
                <div className="prose prose-invert prose-p:text-text-primary prose-p:my-2 prose-li:text-text-primary max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-4 border-t border-slate-600 pt-2">
                    <h4 className="text-xs font-semibold mb-1 opacity-90">Sources:</h4>
                    <ul className="text-xs space-y-1">
                      {message.sources.map((source, i) => (
                        <li key={i} className="truncate">
                          <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline opacity-80 hover:opacity-100">
                            {i+1}. {source.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <ByteBuddyLogo className="w-24 h-24" />
                <h1 className="mt-6 text-3xl font-bold font-sora text-text-primary">
                    Hello, {user?.user_metadata.name}!
                </h1>
                <p className="mt-2 text-text-secondary">
                    How can I help you on your wellness journey today?
                </p>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput
        input={input}
        setInput={setInput}
        handleSendMessage={handleSendMessage}
        loading={loading}
        placeholder={loading ? "ByteBuddy is thinking..." : "Ask me anything about health..."}
      />
    </div>
  );
};

export default ChatPage;
