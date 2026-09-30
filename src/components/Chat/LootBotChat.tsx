import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, Car, ShoppingCart, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
  productLink?: { id: string; title: string; price: number };
}

export const LootBotChat: React.FC = () => {
  const { isChatOpen, setIsChatOpen, userVehicle, navigateToProduct } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      role: 'assistant',
      text: `G'day! I'm LootBot, your CheapLoot AI bargain hunter. Looking for tools, car parts that fit your vehicle, or cheap tech loot? Ask away!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'Find deals under $50',
        userVehicle ? `Parts for my ${userVehicle.model}` : 'Check vehicle fitment',
        'What are your delivery options?',
        'Do you do Click & Collect?'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          vehicleContext: userVehicle ? `${userVehicle.year} ${userVehicle.make} ${userVehicle.model} (${userVehicle.engine || ''})` : null
        })
      });

      const data = await res.json();
      if (data.success) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error(data.error || 'Chat API error');
      }
    } catch (err) {
      console.error('Chat failed:', err);
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: `G'day! You can browse our departments or search by keyword to see current liquidation bargains and dispatch options.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-3 sm:right-4 md:right-6 z-[110] bg-[#B8E62E] text-[#14161A] hover:bg-[#c6f338] p-2.5 sm:px-4 sm:py-3 rounded-full shadow-2xl flex items-center gap-2 font-black transition-transform hover:scale-105 active:scale-95 border-2 border-[#14161A] group"
          id="lootbot-trigger-button"
          aria-label="Open CheapLoot AI Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E21C21] rounded-full animate-ping" />
          </div>
          <span className="hidden sm:inline text-xs uppercase tracking-wider">
            Ask LootBot AI
          </span>
        </button>
      )}

      {/* Floating Chat Modal Panel */}
      {isChatOpen && (
        <div className="fixed bottom-0 md:bottom-6 right-0 md:right-6 z-[1000] w-full sm:max-w-md bg-[#202329] text-white rounded-t-2xl md:rounded-2xl border-2 border-[#B8E62E] shadow-2xl flex flex-col overflow-hidden h-[85vh] md:h-[540px] max-h-[90vh] animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-[#14161A] text-white p-3.5 flex items-center justify-between border-b border-[#2C3038]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-black text-sm text-white flex items-center gap-1.5 leading-none">
                  LootBot AI Assistant
                  <span className="bg-[#E21C21] text-white text-[9px] px-1.5 py-0.2 rounded font-black">AU</span>
                </div>
                <div className="text-[10px] text-[#AEB3BA] font-semibold mt-0.5">
                  Vehicle Fitment & Australian Deal Hunter
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsChatOpen(false)}
              className="text-[#AEB3BA] hover:text-white p-1 rounded hover:bg-[#2C3038] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#14161A] text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black flex-shrink-0 text-[10px]">
                    CL
                  </div>
                )}

                <div
                  className={`max-w-[82%] p-3 rounded-xl space-y-1.5 leading-relaxed font-medium ${
                    m.role === 'user'
                      ? 'bg-[#202329] text-white border border-[#2C3038] rounded-br-none'
                      : 'bg-[#202329] text-[#E6E8EB] border border-[#2C3038] shadow-sm rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  <div
                    className={`text-[9px] ${
                      m.role === 'user' ? 'text-[#AEB3BA] text-right' : 'text-[#AEB3BA]'
                    }`}
                  >
                    {m.timestamp}
                  </div>

                  {/* Suggestion Chips */}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {m.suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(s)}
                          className="text-[10px] bg-[#14161A] hover:bg-[#B8E62E] hover:text-[#14161A] text-[#B8E62E] border border-[#B8E62E] px-2 py-0.5 rounded-full font-bold transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-center text-[#AEB3BA] italic text-xs">
                <div className="w-5 h-5 rounded-full bg-[#B8E62E] animate-spin flex items-center justify-center text-[10px] font-black text-black">
                  ⚡
                </div>
                <span>LootBot is checking warehouse inventory & fitment database...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-[#202329] border-t border-[#2C3038] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about tools, car fitment, or deals..."
              className="flex-1 bg-[#14161A] border border-[#2C3038] text-white placeholder-[#AEB3BA] rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#B8E62E]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#B8E62E] hover:bg-[#c6f338] text-[#14161A] p-2 rounded-lg transition-transform active:scale-95 disabled:opacity-40 font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
