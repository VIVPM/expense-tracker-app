import { createContext, useContext, useState, useCallback } from 'react';

export const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer toasts={toasts} />
        </ToastContext.Provider>
    );
};

const ToastContainer = ({ toasts }) => {
    if (toasts.length === 0) return null;
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in-up pointer-events-auto
                        ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}
                >
                    <span>{toast.type === 'success' ? '✓' : '✕'}</span>
                    {toast.message}
                </div>
            ))}
        </div>
    );
};
