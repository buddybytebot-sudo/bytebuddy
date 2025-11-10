import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { Conversation, Message } from '../types';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  messages: { [key: string]: Message[] };
  loading: boolean;
  addConversation: () => Promise<Conversation>;
  addMessage: (message: Omit<Message, 'id' | 'created_at'>) => Promise<Message>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setLoading(true);
            try {
                const storedConversations = localStorage.getItem(`bytebuddy_conversations_${user.id}`);
                const storedMessages = localStorage.getItem(`bytebuddy_messages_${user.id}`);
                if (storedConversations) {
                    setConversations(JSON.parse(storedConversations));
                } else {
                    setConversations([]); // Ensure it's an empty array if nothing is stored
                }
                if (storedMessages) {
                    setMessages(JSON.parse(storedMessages));
                } else {
                    setMessages({}); // Ensure it's an empty object
                }
            } catch (error) {
                console.error("Error loading chat data from localStorage", error);
            } finally {
                setLoading(false);
            }
        } else {
            // Clear data when user logs out
            setConversations([]);
            setMessages({});
        }
    }, [user]);
    
    useEffect(() => {
        // Persist state to localStorage whenever it changes
        if (user && !loading) {
            localStorage.setItem(`bytebuddy_conversations_${user.id}`, JSON.stringify(conversations));
            localStorage.setItem(`bytebuddy_messages_${user.id}`, JSON.stringify(messages));
        }
    }, [conversations, messages, user, loading]);

    const addConversation = async (): Promise<Conversation> => {
        if (!user) throw new Error("User not authenticated");
        const newConv: Conversation = {
            id: `conv-${Date.now()}`,
            user_id: user.id,
            title: "New Chat",
            created_at: new Date().toISOString(),
        };
        setConversations(prev => [...prev, newConv]);
        setMessages(prev => ({ ...prev, [newConv.id]: [] }));
        return newConv;
    };

    const addMessage = async (message: Omit<Message, 'id' | 'created_at'>): Promise<Message> => {
        if (!user) throw new Error("User not authenticated");
        const newMessage: Message = {
            ...message,
            id: `msg-${Date.now()}`,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => {
            const currentMessages = prev[message.conversation_id] || [];
            return {
                ...prev,
                [message.conversation_id]: [...currentMessages, newMessage],
            };
        });
        return newMessage;
    };

    const updateConversationTitle = async (id: string, title: string) => {
        setConversations(prev =>
            prev.map(c => (c.id === id ? { ...c, title } : c))
        );
    };

    const deleteConversation = async (id: string) => {
        setConversations(prev => prev.filter(c => c.id !== id));
        setMessages(prev => {
            const newMessages = { ...prev };
            delete newMessages[id];
            return newMessages;
        });
    };

    const value = {
        conversations,
        messages,
        loading,
        addConversation,
        addMessage,
        updateConversationTitle,
        deleteConversation,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};