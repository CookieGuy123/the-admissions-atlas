import { useEffect } from "react";
import { X } from "lucide-react";

export interface Toast {
  id: string;
  title: string;
  message: string;
  type: "deadline" | "alert" | "system";
}

const typeStyles: Record<string, string> = {
  deadline: "border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200",
  alert: "border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200",
  system: "border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200",
};

export default function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}>
          <InnerToast toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

function InnerToast({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`pointer-events-auto rounded-lg shadow-lg p-3 pr-8 relative ${typeStyles[toast.type] || typeStyles.system}`}
      style={{ animation: "slideInRight 0.3s ease-out" }}
    >
      <button
        onClick={() => onDismiss(toast.id)}
        className="absolute top-1.5 right-1.5 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <p className="text-xs font-semibold">{toast.title}</p>
      <p className="text-xs mt-0.5 opacity-80">{toast.message}</p>
    </div>
  );
}
