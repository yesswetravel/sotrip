import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import Toast from "./Toast";

interface ToastCtx {
  show: (message: string) => void;
}

const Ctx = createContext<ToastCtx>({ show: () => {} });

export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const show = useCallback((msg: string) => setMessage(msg), []);
  const dismiss = useCallback(() => setMessage(null), []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <Toast message={message} onDismiss={dismiss} />
    </Ctx.Provider>
  );
}
