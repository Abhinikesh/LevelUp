import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'
import { db } from '../../utils/offlineStorage'
import { levelApi } from '../../api/client'
import toast from 'react-hot-toast'

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [syncing, setSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      triggerSync();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = async () => {
    const queue = await db.completionsQueue.toArray();
    if (queue.length === 0) return;

    setSyncing(true);
    toast.loading('Syncing offline completions...', { id: 'offline-sync' });

    try {
      for (const item of queue) {
        await levelApi.complete(item.levelId, item.proofData);
        await db.completionsQueue.delete(item.id);
      }
      setSyncSuccess(true);
      toast.success('Sync complete! Your progress is saved! 🎉', { id: 'offline-sync' });
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to sync offline items:', err);
      toast.error('Sync failed. Will retry automatically later.', { id: 'offline-sync' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-[2000] py-2 px-4 flex items-center justify-center gap-2 border-b text-[11px] font-black text-center"
          style={{
            background: 'linear-gradient(90deg, #D4AF37 0%, #FFB800 100%)',
            borderColor: 'rgba(255,184,0,0.3)',
            color: '#0A0A0F',
          }}
        >
          <WifiOff size={13} className="animate-pulse" />
          Offline Mode active. Level progress is saved locally and will auto-sync once online.
        </motion.div>
      )}

      {syncing && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-[2000] py-2 px-4 flex items-center justify-center gap-2 border-b text-[11px] font-black text-center"
          style={{
            background: 'linear-gradient(90deg, #6C63FF 0%, #9c8dff 100%)',
            borderColor: 'rgba(108,99,255,0.3)',
            color: '#fff',
          }}
        >
          <RefreshCw size={13} className="animate-spin" />
          Syncing offline completions with servers...
        </motion.div>
      )}

      {syncSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-[2000] py-2 px-4 flex items-center justify-center gap-2 border-b text-[11px] font-black text-center"
          style={{
            background: 'linear-gradient(90deg, #43E97B 0%, #38f9d7 100%)',
            borderColor: 'rgba(67,233,123,0.3)',
            color: '#0A0A0F',
          }}
        >
          <CheckCircle size={13} />
          Sync complete! Local levels saved to database successfully.
        </motion.div>
      )}
    </AnimatePresence>
  )
}
