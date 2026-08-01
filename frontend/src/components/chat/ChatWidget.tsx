'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, MessageCircle, SendHorizontal, X, BarChart3, Package, AlertCircle, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import { chatService, ChatMessage } from '@/src/services/chatService';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage = text.trim();
    const currentHistory = [...messages];
    
    setMessages([...currentHistory, { role: 'user', parts: [{ text: userMessage }] }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(userMessage, currentHistory);
      setMessages((prev) => [
        ...prev,
        { role: 'model', parts: [{ text: response.reply }] },
      ]);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi kết nối với trợ lý AI');
      setMessages((prev) => [
        ...prev,
        { role: 'model', parts: [{ text: `*Lỗi: ${error.message || 'Không thể kết nối. Vui lòng thử lại sau.'}*` }] },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    { text: '📊 Hôm nay bán được bao nhiêu?', icon: BarChart3 },
    { text: '📦 Kho còn thiếu gì không?', icon: Package },
    { text: '⚠️ Có cảnh báo gì mới?', icon: AlertCircle },
    { text: '📈 Tổng quan tuần này', icon: TrendingUp },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Panel */}
      <div 
        className={`mb-4 w-[400px] max-w-[calc(100vw-48px)] max-h-[600px] h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-blue-700 rounded-full"></div>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg leading-tight">Trợ Lý AI</h3>
              <p className="text-blue-100 text-xs font-medium tracking-wide">LUMOS COFFEE</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-blue-100 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Đóng chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Bot className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h4 className="text-slate-800 font-semibold mb-1">Xin chào! 👋</h4>
                <p className="text-slate-500 text-sm">Tôi có thể giúp gì cho bạn hôm nay?</p>
              </div>
              
              <div className="grid grid-cols-1 gap-2 w-full mt-4">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(s.text.replace(/^[^\s]+\s/, ''))}
                    className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm hover:bg-blue-50/50 transition-all text-left group"
                  >
                    <div className="w-8 h-8 shrink-0 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <s.icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 shrink-0 mt-1">
                      <Bot className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  <div 
                    className={`max-w-[75%] px-4 py-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-2xl rounded-br-md shadow-sm' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-bl-md shadow-sm prose prose-sm prose-slate max-w-none'
                    }`}
                  >
                    {msg.role === 'model' ? (
                      <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                        }}
                      >
                        {msg.parts[0].text}
                      </ReactMarkdown>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                    )}
                    <div className={`text-[10px] mt-2 text-right ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="bg-white border border-slate-200 px-4 py-4 rounded-2xl rounded-bl-md shadow-sm flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} className="h-px w-full" />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
              placeholder="Nhập tin nhắn..."
              disabled={isLoading}
              className="w-full bg-slate-100 border-none rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all text-slate-800 placeholder-slate-400"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
              aria-label="Gửi tin nhắn"
            >
              <SendHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-105 pointer-events-auto ${
          isOpen ? 'bg-slate-800 hover:bg-slate-700 rotate-90' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 shadow-xl'
        }`}
        aria-label="Mở/Đóng trợ lý AI"
      >
        {isOpen ? <X className="w-6 h-6 -rotate-90 transition-transform" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
