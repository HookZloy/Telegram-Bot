import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { BotSetting } from '../types';
import { Settings, Save, X, Bell, Video, Send, Check } from 'lucide-react';

interface BotSettingsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BotSettingsModal: React.FC<BotSettingsModalProps> = ({ user, isOpen, onClose }) => {
  const [defaultQuality, setDefaultQuality] = useState<BotSetting['defaultQuality']>('1080p');
  const [autoDownload, setAutoDownload] = useState<BotSetting['autoDownload']>('enabled');
  const [targetChatId, setTargetChatId] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState<BotSetting['notificationEnabled']>('true');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!user || !isOpen) return;

    const loadSettings = async () => {
      const docPath = `users/${user.uid}/settings/default`;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'settings', 'default'));
        if (snap.exists()) {
          const data = snap.data() as BotSetting;
          if (data.defaultQuality) setDefaultQuality(data.defaultQuality);
          if (data.autoDownload) setAutoDownload(data.autoDownload);
          if (data.targetChatId) setTargetChatId(data.targetChatId);
          if (data.notificationEnabled) setNotificationEnabled(data.notificationEnabled);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, docPath);
      }
    };

    loadSettings();
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
      return;
    }

    setSaving(true);
    const docPath = `users/${user.uid}/settings/default`;
    const newSettings: BotSetting = {
      userId: user.uid,
      defaultQuality,
      autoDownload,
      targetChatId: targetChatId.trim() || undefined,
      notificationEnabled,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'default'), newSettings);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-zinc-800">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Bot &amp; Download Preferences</h3>
            <p className="text-xs text-zinc-400">Configure default behaviors for Downloader_GodBot</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Default Quality */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-sky-400" /> Default Quality Preset
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['1080p', '720p', '480p', 'mp3'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setDefaultQuality(q)}
                  className={`py-2 text-xs rounded-xl font-medium border uppercase transition-all ${
                    defaultQuality === q
                      ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border-zinc-800'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Download */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Instant Cloud Link Processing
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'enabled', label: 'Enabled (Auto Extract)' },
                { id: 'disabled', label: 'Prompt for Quality' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAutoDownload(opt.id as any)}
                  className={`py-2 text-xs rounded-xl font-medium border transition-all ${
                    autoDownload === opt.id
                      ? 'bg-sky-600 text-white border-sky-500'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border-zinc-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Telegram Chat ID */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-sky-400" /> Forward Downloads to Telegram Chat ID
            </label>
            <input
              type="text"
              placeholder="e.g. 123456789 or @my_channel"
              value={targetChatId}
              onChange={(e) => setTargetChatId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 font-mono"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Bot will automatically dispatch completed files to this Telegram recipient.
            </p>
          </div>

          {/* Notifications */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" /> Completion Notifications
            </label>
            <select
              value={notificationEnabled}
              onChange={(e) => setNotificationEnabled(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="true">Notify on Download Completion</option>
              <option value="false">Silent Processing</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-all disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
