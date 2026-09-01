"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";

type Toast = { id: number; message: string };
type AppContextValue = {
  toast: (message: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProviders");
  return context;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      localStorage.removeItem("fhq-theme");
      localStorage.removeItem("fhq-density");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = "light";
  }, []);

  const toast = useCallback((message: string) => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 3200);
    navigator.vibrate?.(12);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <AppContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="fixed bottom-20 right-4 z-[90] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2 md:bottom-4">
        <AnimatePresence>
          {toasts.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 16, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: .22 }} className="card flex items-center gap-3 px-4 py-3 shadow-2xl">
              <CheckCircle2 size={18} className="gold shrink-0" />
              <span className="flex-1 font-medium">{item.message}</span>
              <button aria-label="Dismiss notification" onClick={() => setToasts((current) => current.filter((toastItem) => toastItem.id !== item.id))}><X size={16} /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AppContext.Provider>
  );
}
