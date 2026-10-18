import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { loginWithGoogle, logoutUser } from '../firebase';
import { Bot, LogIn, LogOut, Copy, Check, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';
import { TelegramBotInfo } from '../types';
import { StorageUsageIndicator } from './StorageUsageIndicator';

interface HeaderProps {
  user: User | null;
  botInfo: TelegramBotInfo | null;
  botLoading: boolean;
  usedStorageMB?: number;
}

export const Header: React.FC<HeaderProps> = ({ user, botInfo, botLoading, usedStorageMB }) => {
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const copyCliCommand = () => {
    navigator.clipboard.writeText('npm create @tgcloud/bot Downloader_GodBot');
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const copyToken = () => {
    navigator.clipboard.writeText('8701498346:AAHrGsDhrK8TLLP-KGl_8SmRqyc3JcOseFo');
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Bot identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold text-lg ring-1 ring-white/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">Downloader_GodBot</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  Cloud Bot v2.4
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Telegram Media Downloader &amp; AI Control Center
              </p>
            </div>
          </div>

          {/* Bot Live Status Pill */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${botInfo ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${botInfo ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-zinc-300 font-mono">
              {botLoading ? 'Checking...' : botInfo ? `@${botInfo.username}` : 'Bot Active'}
            </span>
          </div>
        </div>

        {/* Quick CLI snippet and Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* CLI quick badge */}
          <div className="hidden lg:flex items-center gap-2 bg-zinc-900/90 border border-zinc-800/80 rounded-lg px-2.5 py-1 text-xs text-zinc-300 font-mono">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span>npm create @tgcloud/bot Downloader_GodBot</span>
            <button
              onClick={copyCliCommand}
              title="Copy CLI command"
              className="p-1 hover:text-white transition-colors text-zinc-400"
            >
              {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Storage Usage Indicator */}
          <StorageUsageIndicator customUsedMB={usedStorageMB} totalQuotaGB={20} />

          <a
            href="https://t.me/Downloader_GodBot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-xs font-medium transition-all"
          >
            <span>Open in Telegram</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* User Sign-In / Profile */}
          {user ? (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1 pr-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-md object-cover ring-1 ring-zinc-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-md bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-medium text-zinc-200 truncate max-w-[110px]">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" /> Verified
                </span>
              </div>
              <button
                onClick={logoutUser}
                title="Sign Out"
                className="ml-1 p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-950 font-medium text-xs shadow-sm transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Google Sign-In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
