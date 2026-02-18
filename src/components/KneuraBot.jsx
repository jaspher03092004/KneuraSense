'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Bot, ChevronRight } from 'lucide-react';

export default function KneuraBot() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // The conversation decision tree (Expanded with Step-by-Step Diagnostics)
  const botLogic = {
    start: {
      text: "Hi! I'm the KneuraSense Assistant. What do you need help with today?",
      options: [
        { label: "Run Diagnostic Tool", next: "diag_start" },
        { label: "The Red LED is flashing!", next: "red_alert_action" },
        { label: "Why am I getting early alerts?", next: "early_alerts" },
        { label: "Wi-Fi & Standard Setup", next: "wifi" }
      ]
    },
    
    // --- INTERACTIVE DIAGNOSTIC TREE ---
    diag_start: {
      text: "Let's troubleshoot your hardware. What seems to be the main issue?",
      options: [
        { label: "Device won't connect to App", next: "diag_conn_1" },
        { label: "Sensors read 0 or inaccurate", next: "diag_sens_1" },
        { label: "Device won't turn on", next: "diag_pwr_1" }
      ]
    },
    
    // Diagnostic Branch: Connection
    diag_conn_1: {
      text: "Okay, let's check the connection. Look at the LED on your sensor pod. What color is it currently showing?",
      options: [
        { label: "Blinking Yellow", next: "diag_conn_yellow" },
        { label: "Solid Blue or Blinking Blue", next: "diag_conn_blue" },
        { label: "No Light at all", next: "diag_pwr_1" }
      ]
    },
    diag_conn_yellow: {
      text: "Blinking Yellow means it is in 'Provisioning Mode' and waiting for Wi-Fi. \n\nFix: Open the KneuraSense app, tap 'Connect', and scan the QR code to pass your Wi-Fi credentials to the device.",
      options: [{ label: "Return to Main Menu", next: "start" }]
    },
    diag_conn_blue: {
      text: "Blue means the system is booting or trying to connect. If it stays blue for more than 30 seconds, your Wi-Fi router might be blocking it (ensure it is a 2.4GHz network, not 5GHz).",
      options: [{ label: "Return to Main Menu", next: "start" }]
    },

    // Diagnostic Branch: Sensors
    diag_sens_1: {
      text: "If your dashboard shows 0 Newtons or incorrect angles, the sensors might need recalibration. \n\nAre you wearing the sleeve exactly as instructed (Upper IMU on thigh, FSR over kneecap)?",
      options: [
        { label: "Yes, it is positioned correctly", next: "diag_sens_calib" },
        { label: "No, let me fix it", next: "start" }
      ]
    },
    diag_sens_calib: {
      text: "Let's force a recalibration: \n1. Stand completely still with your leg straight. \n2. Press and hold the physical button on the sensor pod for 3 seconds until the LED flashes Yellow twice. \n3. Wait 5 seconds and check the dashboard.",
      options: [{ label: "Return to Main Menu", next: "start" }]
    },

    // Diagnostic Branch: Power
    diag_pwr_1: {
      text: "If there are no LED lights, the battery is likely completely drained or the pod is off. Please plug it into a USB-C charger. Does the LED turn solid green or red?",
      options: [
        { label: "Yes, it lit up", next: "start" },
        { label: "No, still dead", next: "diag_pwr_dead" }
      ]
    },
    diag_pwr_dead: {
      text: "If the device remains unresponsive while plugged in, there may be a hardware fault. Please contact your clinician or the IT team for a replacement pod.",
      options: [{ label: "Return to Main Menu", next: "start" }]
    },

    // --- STANDARD QUESTIONS ---
    red_alert_action: {
      text: "Stop your current activity immediately. Your knee stress has exceeded safe levels. \n\n1. Sit down and elevate your legs.\n2. Apply ice to the patellar region if available.\n3. Do not resume activity until your Risk Score drops to the Green Zone.",
      options: [{ label: "Return to Main Menu", next: "start" }]
    },
    early_alerts: {
      text: "KneuraSense uses 'Context-Aware' AI. If the weather is highly humid or if the Barometer detects you are climbing stairs, the AI automatically lowers your 'Safe Threshold' to prevent invisible joint fatigue.",
      options: [{ label: "Return to Main Menu", next: "start" }]
    },
    wifi: {
      text: "To connect to Wi-Fi, ensure your device is in Provisioning Mode (blinking yellow LED). Use the mobile app to scan the QR code to input your Wi-Fi SSID and password.",
      options: [{ label: "Return to Main Menu", next: "start" }]
    }
  };

  const [chatHistory, setChatHistory] = useState([
    { sender: 'bot', ...botLogic.start }
  ]);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isOpen]);

  const handleOptionClick = (option) => {
    // 1. Add user's choice to the chat
    const newHistory = [...chatHistory, { sender: 'user', text: option.label }];
    setChatHistory(newHistory);

    // 2. Add a slight delay for a "natural" feel, then add bot response
    setTimeout(() => {
      const nextStep = botLogic[option.next];
      setChatHistory((prev) => [...prev, { sender: 'bot', ...nextStep }]);
    }, 400);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white dark:bg-slate-900 w-80 sm:w-96 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 mb-4 overflow-hidden flex flex-col h-[500px] max-h-[80vh] transition-all duration-300 transform origin-bottom-right">
          
          {/* Header */}
          <div className="bg-[#2D5F8B] p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <h3 className="font-bold text-sm">KneuraSense Support</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-blue-100 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-[#2D5F8B] text-white rounded-tr-sm' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm shadow-sm'
                }`}>
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  
                  {/* Render clickable options if the bot sent them */}
                  {msg.options && (
                    <div className="mt-3 space-y-2">
                      {msg.options.map((opt, i) => (
                         <button 
                           key={i}
                           onClick={() => handleOptionClick(opt)}
                           className="w-full text-left text-xs font-semibold px-3 py-2 rounded-lg border border-[#2D5F8B]/20 text-[#2D5F8B] dark:text-blue-400 hover:bg-[#2D5F8B]/5 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-between group"
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
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${isOpen ? 'bg-slate-700 dark:bg-slate-800' : 'bg-[#2D5F8B]'}`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

    </div>
  );
}