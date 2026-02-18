'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MessageCircle, X, Bot, ChevronRight, Loader2 } from 'lucide-react';

export default function KneuraBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
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
        { label: "Yes, it is positioned correctly", next: "diag_sens_calib" },
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
        const response = await fetch(`/patient/${patientId}/summary`);
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

    setTimeout(() => {
      const nextStep = botLogic[option.next];
      setChatHistory((prev) => [...prev, { sender: 'bot', ...nextStep }]);
    }, 400);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white dark:bg-slate-900 w-80 sm:w-96 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 mb-4 overflow-hidden flex flex-col h-[500px] max-h-[80vh] transition-all duration-300">
          <div className="bg-[#2D5F8B] p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <h3 className="font-bold text-sm">KneuraSense Support</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-blue-100 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-[#2D5F8B] text-white rounded-tr-sm' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm shadow-sm'
                }`}>
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  {msg.options && (
                    <div className="mt-3 space-y-2">
                      {msg.options.map((opt, i) => (
                         <button 
                           key={i}
                           onClick={() => handleOptionClick(opt)}
                           className="w-full text-left text-xs font-semibold px-3 py-2 rounded-lg border border-[#2D5F8B]/20 text-[#2D5F8B] dark:text-blue-400 hover:bg-[#2D5F8B]/5 transition-colors flex items-center justify-between group"
                         >
                           {opt.label}
                           <ChevronRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                         </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
               <div className="flex justify-start">
                 <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm p-3 shadow-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-[#2D5F8B]" />
                    <span className="text-xs text-slate-500 font-medium">Analyzing your movement logs...</span>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${isOpen ? 'bg-slate-700' : 'bg-[#2D5F8B]'}`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}