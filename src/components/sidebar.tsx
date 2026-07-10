"use client";
import { LayoutDashboard, Upload, History, UserCircle, LogOut, UploadCloud, FileText, Sparkles} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
// import { LayoutDashboard, UploadCloud, History, LogOut } from 'lucide-react';

const Sidebar = () => {
  // const userName = typeof window !== 'undefined' ? localStorage.getItem('userName') : 'User';
  const [userName, setUserName] = useState('User');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoice' | 'smart'>('invoice');

  useEffect(() => {
   const token = localStorage.getItem('token');
    const storedName = localStorage.getItem('userName');
    if (token && storedName) {
      setUserName(storedName);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };
  return (
    <div className="h-screen w-64 bg-slate-900 text-white p-6 flex flex-col fixed left-0 top-0">
      <h1 className="text-2xl font-bold mb-10 text-blue-400">Gidr</h1>

      {/* NAVIGATION LINKS */}
      <nav className="flex flex-col flex-1 space-y-4">
        <Link href="/" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition">
          <LayoutDashboard size={20} /> 
          <span>Dashboard</span>
        </Link>
        <Link href="/upload" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition">
          <UploadCloud size={20} /> 
          <span>New Upload</span>
        </Link>
        <Link href="/history" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition">
          <History size={20} /> 
          <span>History</span>
        </Link>
        
<Link href="/audits" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition">
  <FileText size={20} />
  <span>Audit Reports</span>
</Link>
<Link href="/vendor-intelligence" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition">
  <Sparkles size={20} />
  <span>Vendor Intelligence</span>
</Link>
      </nav>

      {/* USER ACCOUNT SECTION (Combined & Fixed) */}
      <div className="mt-auto border-t border-slate-700 pt-6">
        {isLoggedIn ? (
          /* STATE: LOGGED IN */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold shadow-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-slate-400">Standard Account</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 w-full hover:bg-red-500/10 text-red-400 rounded transition group"
            >
              <LogOut size={20} className="group-hover:translate-x-1 transition-transform" /> 
              <span>Logout</span>
            </button>
          </div>
        ) : (
          /* STATE: NOT LOGGED IN */
          // ✅ Replace the single Link with two links:
<div className="space-y-2">
  <Link href="/login" className="flex items-center gap-3 p-3 rounded hover:bg-slate-800 transition border border-dashed border-slate-600 group">
    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
      <UserCircle size={24} className="text-slate-400" />
    </div>
    <span className="text-sm font-medium text-blue-400">Sign In</span>
  </Link>
  <Link href="/register" className="flex items-center gap-3 p-3 rounded hover:bg-slate-800 transition text-slate-400 text-sm">
    + Create Account
  </Link>
</div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;