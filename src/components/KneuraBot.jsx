'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MessageCircle, X, Bot, Send, User } from 'lucide-react';

export default function KneuraBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLimitExceeded, setIsLimitExceeded] = useState(false);
  const messagesEndRef = useRef(null);
  const params = useParams();
  const patientId = params?.id;

  const botLogic = {
    start: {
      text: "Hi! I'm the KneuraSense Assistant. What do you need help with today?",
      options: [
        { label: "Summarize My Day (AI)", next: "api_summary" },
        { label: "Run Diagnostic Tool", next: "diag_start" },
        { label: "The Red LED is flashing!", next: "red_alert_action" },
        { label: "Why am I getting early alerts?", next: "early_alerts" },
        { label: "Wi-Fi & Standard Setup", next: "wifi" }
      ]
    },
    diag_start: {
      text: "Let's troubleshoot your hardware. What seems to be the main issue?",
      options: [
        { label: "Device won't connect to App", next: "diag_conn_1" },
        { label: "Sensors read 0 or inaccurate", next: "diag_sens_1" },
        { label: "Device won't turn on", next: "diag_pwr_1" }
      ]
    },
    diag_conn_1: {
      text: "Okay, let's check the connection. Look at the LED on your sensor pod. What color is it currently showing?",
      options: [
        { label: "Blinking Yellow", next: "diag_conn_yellow" },
        { label: "Solid Blue or Blinking Blue", next: "diag_conn_blue" },
        { label: "No Light at all", next: "diag_pwr_1" }
      ]
    },
    diag_conn_yellow: {
      text: "Blinking Yellow means it is in 'Provisioning Mode'. Open the app and scan the QR code.",
      options: [{ label: "Return to Main Menu", next: "start" }]
    },
    diag_conn_blue: {
      text: "Blue means the system is booting. Ensure you are on a 2.4GHz Wi-Fi network.",
      options: [{ label: "Return to Main Menu", next: "start" }]
    },
    diag_sens_1: {
      text: "Are you wearing the sleeve exactly as instructed (Upper IMU on thigh, FSR over kneecap)?",
      options: [
        { label: "Yes, positioned correctly", next: "diag_sens_calib" },
        { label: "No, let me fix it", next: "start" }
      ]
    },
    diag_sens_calib: {
      text: "Press and hold the button for 3 seconds until the LED flashes Yellow twice to recalibrate.",
      options: [{ label: "Return to Main Menu", next: "start" }]
    },
    diag_pwr_1: {
      text: "Please plug it into a USB-C charger. Does the LED turn solid green or red?",
      options: [
        { label: "Yes, it lit up", next: "start" },
        { label: "No, still dead", next: "diag_pwr_dead" }
      ]
    },
    diag_pwr_dead: {
      text: "If the device remains unresponsive, please contact your clinician for a replacement.",
      options: [{ label: "Return to Main Menu", next: "start" }]
    },
    red_alert_action: {
      text: "Stop activity immediately. Sit down and elevate your legs until your Risk Score drops.",
      options: [{ label: "Return to Main Menu", next: "start" }]
    },
    early_alerts: {
      text: "KneuraSense lowers your 'Safe Threshold' in high humidity or during stair climbing to prevent joint fatigue.",
      options: [{ label: "Return to Main Menu", next: "start" }]
    },
    wifi: {
      text: "Ensure the device is blinking yellow, then use the app to input your Wi-Fi credentials.",
      options: [{ label: "Return to Main Menu", next: "start" }]
    }
  };

  const [chatHistory, setChatHistory] = useState([
    { sender: 'bot', ...botLogic.start }
  ]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isOpen, isTyping]);

  const handleOptionClick = async (option) => {
    setChatHistory(prev => [...prev, { sender: 'user', text: option.label }]);

    if (option.next === "api_summary") {
      setIsTyping(true);
      try {
        const response = await fetch(`/api/patient/${patientId}/summary`);
        
        if (response.status === 429) {
          setIsLimitExceeded(true);
          setChatHistory(prev => [...prev, { 
            sender: 'bot', 
            text: "You have reached your daily limit for free AI summaries. Please upgrade your tier or try again tomorrow!",
            options: [{ label: "Return to Main Menu", next: "start" }]
          }]);
          setIsTyping(false);
          return;
        }

        const data = await response.json();
        
        setChatHistory(prev => [...prev, { 
          sender: 'bot', 
          text: data.summary,
          options: [{ label: "Return to Main Menu", next: "start" }]
        }]);
      } catch (error) {
        setChatHistory(prev => [...prev, { 
          sender: 'bot', 
          text: "I couldn't fetch your data right now. Please check your connection.",
          options: [{ label: "Return to Main Menu", next: "start" }]
        }]);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    setIsTyping(true);
    setTimeout(() => {
      const nextStep = botLogic[option.next];
      setChatHistory((prev) => [...prev, { sender: 'bot', ...nextStep }]);
      setIsTyping(false);
    }, 600);
  };

  const handleCustomPromptSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setInputValue(''); 
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setIsTyping(true);

    try {
      const response = await fetch(`/api/patient/${patientId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText }),
      });

      if (response.status === 429) {
        setIsLimitExceeded(true);
        setChatHistory(prev => [...prev, { 
          sender: 'bot', 
          text: "⚠️ You've reached your daily limit for free AI questions. Please upgrade your plan or try again tomorrow!",
          options: [{ label: "Return to Main Menu", next: "start" }]
        }]);
        setIsTyping(false);
        return;
      }

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      
      setChatHistory(prev => [...prev, { 
        sender: 'bot', 
        text: data.reply || "I received your message!",
        options: [{ label: "Return to Main Menu", next: "start" }]
      }]);

    } catch (error) {
      setChatHistory(prev => [...prev, { 
        sender: 'bot', 
        text: "I'm having trouble connecting to my brain right now. Please try again later.",
        options: [{ label: "Return to Main Menu", next: "start" }]
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="bg-white dark:bg-slate-950 w-[350px] sm:w-[400px] rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 mb-4 overflow-hidden flex flex-col h-[600px] max-h-[85vh] transition-all duration-300 transform origin-bottom-right">
          
          {/* Header */}
          <div className="bg-[#2D5F8B] dark:bg-slate-900 p-4 flex justify-between items-center text-white shrink-0 shadow-md z-10 border-b border-transparent dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full border border-white/20">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight">KneuraSense Assistant</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${isLimitExceeded ? 'bg-red-400' : 'bg-green-400'}`}></span>
                  <p className="text-xs text-blue-100 dark:text-slate-300">
                    {isLimitExceeded ? "Usage limit exceeded" : "Online & ready to help"}
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-1 text-blue-200 dark:text-slate-400 hover:text-white dark:hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#F8FBFC] dark:bg-slate-950 scroll-smooth">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                {/* Bot Avatar */}
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-[#2D5F8B] dark:bg-slate-800 flex items-center justify-center shrink-0 mr-2 mt-auto border border-[#1E405E] dark:border-slate-700">
                    <Bot size={16} className="text-white dark:text-blue-400" />
                  </div>
                )}

                <div className={`flex flex-col max-w-[75%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Message Bubble */}
                  <div className={`p-3.5 text-sm shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-[#2D5F8B] dark:bg-blue-600 text-white rounded-2xl rounded-br-sm border border-[#2D5F8B] dark:border-blue-600' 
                      : 'bg-white dark:bg-slate-900 text-[#2C3E50] dark:text-slate-200 border border-gray-200 dark:border-slate-800 rounded-2xl rounded-bl-sm'
                  }`}>
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  </div>

                  {/* Interactive Options as Chips */}
                  {msg.options && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.options.map((opt, i) => (
                         <button 
                           key={i}
                           onClick={() => handleOptionClick(opt)}
                           disabled={isTyping}
                           className="text-xs font-medium px-4 py-2 rounded-full border border-[#2D5F8B] dark:border-slate-600 text-[#2D5F8B] dark:text-blue-400 bg-transparent hover:bg-[#2D5F8B] hover:text-white dark:hover:bg-slate-800 dark:hover:text-blue-300 transition-all disabled:opacity-50 flex items-center gap-1 group shadow-sm"
                         >
                           {opt.label}
                         </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#E8F4F8] dark:bg-slate-800 flex items-center justify-center shrink-0 ml-2 mt-auto border border-[#2D5F8B]/20 dark:border-slate-700">
                    <User size={16} className="text-[#2D5F8B] dark:text-blue-400" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
               <div className="flex justify-start w-full">
                 <div className="w-8 h-8 rounded-full bg-[#2D5F8B] dark:bg-slate-800 flex items-center justify-center shrink-0 mr-2 mt-auto border border-[#1E405E] dark:border-slate-700">
                    <Bot size={16} className="text-white dark:text-blue-400" />
                  </div>
                 <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#2D5F8B]/60 dark:bg-blue-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-[#2D5F8B]/60 dark:bg-blue-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-[#2D5F8B]/60 dark:bg-blue-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form 
            onSubmit={handleCustomPromptSubmit} 
            className="p-3 bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isTyping}
                placeholder="Type your message..."
                className="w-full bg-gray-100 dark:bg-slate-900 text-[#2C3E50] dark:text-slate-100 text-sm rounded-full pl-4 pr-12 py-3 border border-transparent focus:outline-none focus:border-[#2D5F8B] dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 transition-all disabled:opacity-60"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-1.5 w-9 h-9 flex items-center justify-center bg-[#2D5F8B] dark:bg-blue-600 text-white rounded-full hover:bg-[#1A3A54] dark:hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-[#2D5F8B] dark:disabled:hover:bg-blue-600 transition-all"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </div>
          </form>

        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white dark:text-blue-400 shadow-xl transition-all duration-300 border border-[#2D5F8B] dark:border-slate-700 hover:scale-105 active:scale-95 ${isOpen ? 'bg-[#1A3A54] dark:bg-slate-700 rotate-90 text-white' : 'bg-[#2D5F8B] dark:bg-slate-800'}`}
      >
        {isOpen ? <X size={26} className="text-white dark:text-blue-400" /> : <MessageCircle size={26} />}
      </button>
    </div>
  );
}