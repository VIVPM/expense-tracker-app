import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send } from 'lucide-react';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const toggleChat = () => setIsOpen(!isOpen);

    useEffect(() => {
        if (isOpen) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000); // Poll every 3s
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        try {
            const res = await axios.get('/api/chats/');
            setMessages(res.data);
        } catch (error) {
            console.error("Failed to fetch chats", error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        try {
            const newMessage = { message: input, is_support: false };
            // Optimistic update
            // setMessages([...messages, { ...newMessage, id: Date.now() }]); // wait for server response
            await axios.post('/api/chats/', newMessage);
            setInput('');
            fetchMessages();
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <button
                    onClick={toggleChat}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-full text-white shadow-xl shadow-indigo-300 hover:scale-110 transition-all duration-300"
                >
                    <MessageCircle size={28} />
                </button>
            )}

            {isOpen && (
                <div className="bg-white w-80 sm:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden animate-fade-in-up">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex justify-between items-center shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-full">
                                <MessageCircle size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">FinBot</h3>
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                    <span className="text-[10px] text-indigo-100">Online</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={toggleChat} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        <div className="flex justify-center">
                            <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-1 rounded-full">Today</span>
                        </div>
                        <div className="flex justify-start">
                            <div className="max-w-[85%] bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-gray-800 text-sm">
                                <p>👋 Hi! I can help you file expenses.</p>
                                <p className="mt-2 text-gray-500 text-xs">Try typing: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">Expense: Food 500</span></p>
                            </div>
                        </div>

                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.is_support ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${msg.is_support
                                        ? 'bg-white border border-gray-100 text-gray-800'
                                        : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                                    }`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                    <span className={`text-[10px] block mt-1 text-right ${msg.is_support ? 'text-gray-400' : 'text-indigo-100'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 gap-2 flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type an expense..."
                            className="flex-1 bg-gray-50 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
                        />
                        <button type="submit" disabled={!input.trim()} className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-200">
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};
export default ChatWidget;
