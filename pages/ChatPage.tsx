import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { geminiService } from '../services/geminiService';
import { SendIcon, ByteBuddyLogo } from '../components/ui/Icons';
import { GenerateContentResponse } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !user) return;
    
    let currentConvId = conversationId;
    const isNewChat = !currentConvId;

    setLoading(true);
    
    const userMessageContent = input.trim();
    setInput('');

    if (isNewChat) {
        const newConv = await addConversation();
        currentConvId = newConv.id;
        navigate(`/chat/${currentConvId}`, { replace: true });

        geminiService.generateTitle(userMessageContent).then(title => {
           updateConversationTitle(newConv.id, title);
        });
    }

    if (!currentConvId) {
        console.error("Conversation ID is missing.");
        setLoading(false);
        return;
    }

    await addMessage({
      conversation_id: currentConvId,
      content: userMessageContent,
      role: 'user',
    });
    
    try {
      const chatHistory = [...(messages[currentConvId] || []), {
          id: 'temp',
          conversation_id: currentConvId,
          content: userMessageContent,
          role: 'user',
          created_at: new Date().toISOString()
      }];

      const aiResponse: GenerateContentResponse = await geminiService.getChatResponse(chatHistory, userProfile);
      
      const groundingChunks = aiResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = groundingChunks?.map((chunk: any) => ({
        uri: chunk.web.uri,
        title: chunk.web.title,
      })).filter((source: any) => source.uri && source.title) || [];

      await addMessage({
        conversation_id: currentConvId,
        content: aiResponse.text,
        role: 'assistant',
        sources: sources,
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      await addMessage({
        conversation_id: currentConvId,
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
      });
    } finally {
      setLoading(false);
    }
  };

  const placeholder = !conversationId ? "Ask ByteBuddy anything to start a new chat..." : "Ask a health question...";

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="flex-1 flex flex-col justify-center items-center">
            <h1 className="text-5xl font-bold font-sora text-text-primary">Welcome to ByteBuddy</h1>
            <p className="mt-4 text-xl text-text-secondary">How can I assist you with your health and wellness goals today?</p>
        </div>
        <ChatInput 
          input={input}
          setInput={setInput}
          handleSendMessage={handleSendMessage}
          loading={loading}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {currentMessages.map((message) => (
          <div key={message.id} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && <ByteBuddyLogo className="w-8 h-8 flex-shrink-0 mt-1" />}
            <div className={`max-w-xl p-4 rounded-2xl shadow-md fade-in-up ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-primary to-secondary text-white rounded-br-lg'
                : 'bg-card text-text-primary rounded-bl-lg'
            }`}>
              {message.role === 'user' ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none prose-headings:font-sora prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-1 prose-p:text-text-secondary prose-li:text-text-secondary prose-strong:text-text-primary">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
              )}
               {message.sources && message.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-600">
                  <h4 className="text-xs font-semibold mb-2">Sources:</h4>
                  <ul className="space-y-1 text-xs">
                    {message.sources.map((source, index) => (
                      <li key={index}>
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                          {index + 1}. {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-4 justify-start">
             <ByteBuddyLogo className="w-8 h-8 flex-shrink-0 mt-1" />
            <div className="max-w-xl p-4 rounded-2xl shadow-md bg-card text-text-primary rounded-bl-lg">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse"></div>
                </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput
        input={input}
        setInput={setInput}
        handleSendMessage={handleSendMessage}
        loading={loading}
        placeholder={placeholder}
      />
    </div>
  );
};

export default ChatPage;
