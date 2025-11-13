
import React, 'react';
import Sidebar from './Sidebar';
import { MenuIcon, ByteBuddyLogo } from './ui/Icons';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <div className="relative z-10 flex flex-shrink-0 h-16 bg-background md:hidden">
          <button
            type="button"
            className="px-4 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="w-6 h-6" />
          </button>
           <div className="flex items-center px-4">
            <ByteBuddyLogo className="w-8 h-8 mr-2" />
            <h1 className="text-xl font-sora font-bold text-text-primary">ByteBuddy</h1>
           </div>
        </div>

        <main className="relative flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;