
import React, { useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { PlusIcon, LogoutIcon, PencilIcon, TrashIcon } from './ui/Icons';
import { Conversation } from '../types';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const { user, signOut } = useAuth();
  const { conversations, addConversation, updateConversationTitle, deleteConversation } = useChat();
  const navigate = useNavigate();
  const { id: activeConvId } = useParams();

  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleNewChat = async () => {
    const newConv = await addConversation();
    navigate(`/chat/${newConv.id}`);
    setOpen(false);
  };
  
  const handleEditStart = (conv: Conversation) => {
    setEditingConvId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleEditSave = () => {
    if (editingConvId && editingTitle.trim()) {
      updateConversationTitle(editingConvId, editingTitle.trim());
    }
    setEditingConvId(null);
    setEditingTitle('');
  };

  const handleEditCancel = () => {
    setEditingConvId(null);
    setEditingTitle('');
  };

  const handleDelete = (convId: string) => {
    deleteConversation(convId);
    if (activeConvId === convId) {
        navigate('/chat');
    }
  };


  const mainLinks = [
    { name: 'Logger', href: '/logger' },
    { name: 'Dietary Plan', href: '/dietary-plan' },
    { name: 'Food Analysis', href: '/food-analysis' },
  ];
  
  const sortedConversations = [...conversations].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const content = (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center flex-shrink-0 px-2 pt-1 pb-3">
          <h1 className="text-2xl font-sora font-bold text-text-primary">ByteBuddy</h1>
      </div>
      
      <button
        onClick={handleNewChat}
        className="flex items-center justify-center w-full px-4 py-3 rounded-lg shadow-sm text-lg font-medium text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-transform transform hover:scale-105"
      >
        <PlusIcon className="w-5 h-5 mr-2" />
        New Chat
      </button>
      
      <div className="flex-1 mt-6 overflow-y-auto px-2 space-y-4">
        <div className="space-y-2">
          <h3 className="px-2 pt-2 text-sm font-semibold text-text-secondary uppercase tracking-wider">Chat History</h3>
          <nav className="space-y-1">
            {sortedConversations.map((conv) => (
                <div key={conv.id} className="group relative rounded-md">
                    {editingConvId === conv.id ? (
                        <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={handleEditSave}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSave();
                                if (e.key === 'Escape') handleEditCancel();
                            }}
                            className="w-full bg-card px-2 py-1.5 text-md rounded-md text-text-primary outline-none ring-2 ring-primary"
                            autoFocus
                        />
                    ) : (
                        <>
                            <NavLink
                            to={`/chat/${conv.id}`}
                            onClick={() => setOpen(false)}
                            className={({ isActive }) =>
                                `block w-full px-2 py-1.5 text-md rounded-md truncate transition-colors ${
                                isActive ? 'text-text-primary font-semibold bg-card/50' : 'text-text-secondary hover:text-text-primary'
                                }`
                            }
                            >
                            {conv.title}
                            </NavLink>
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditStart(conv)} className="p-1 text-text-secondary hover:text-text-primary">
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(conv.id)} className="p-1 text-text-secondary hover:text-red-500">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ))}
          </nav>
        </div>
        
        <div className="space-y-2">
          <h3 className="px-2 pt-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">Tools</h3>
          <nav className="space-y-1">
            {mainLinks.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block w-full px-2 py-1.5 text-md rounded-md transition-colors ${
                    isActive ? 'text-text-primary font-semibold' : 'text-text-secondary hover:text-text-primary'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-shrink-0 p-2">
        <div className="flex items-center justify-between">
            <p className="text-md font-medium text-text-primary truncate">{user?.user_metadata.name || user?.username}</p>
            <button onClick={signOut} className="p-2 rounded-full hover:bg-card text-text-secondary hover:text-text-primary">
                <LogoutIcon className="w-6 h-6"/>
            </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${open ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <div className="fixed inset-0 bg-black bg-opacity-60" onClick={() => setOpen(false)}></div>
        <div className="relative flex flex-col flex-1 w-full max-w-xs bg-background border-r border-slate-800">
          {content}
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-72">
          <div className="flex flex-col flex-1 h-0 bg-background border-r border-slate-700">
            {content}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;