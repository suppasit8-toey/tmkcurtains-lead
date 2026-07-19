'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function WelcomeScreen() {
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Only show once per session
    const hasSeen = sessionStorage.getItem('hasSeenWelcome');
    if (!hasSeen) {
      setShow(true);
      sessionStorage.setItem('hasSeenWelcome', 'true');
      
      // Auto close after 3.5 seconds
      const timer = setTimeout(() => {
        closeWelcome();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeWelcome = () => {
    setClosing(true);
    setTimeout(() => {
      setShow(false);
    }, 500); // Wait for fade out animation
  };

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-5 transition-opacity duration-500 ${closing ? 'opacity-0' : 'opacity-100'}`}>
      {/* Blurred Backdrop */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={closeWelcome} />
      
      {/* Content Card */}
      <div className={`relative z-10 bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 max-w-md w-full flex flex-col items-center text-center transform transition-all duration-700 ${closing ? 'scale-95 translate-y-4' : 'animate-bounce-in'}`}>
        
        <div className="relative w-48 h-48 mb-6 drop-shadow-xl animate-float">
          <Image 
            src="/welcome_illustration.png" 
            alt="Welcome" 
            fill 
            className="object-contain rounded-2xl"
          />
        </div>

        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
          ยินดีต้อนรับ!
        </h2>
        <p className="text-gray-600 text-base mb-8">
          เข้าสู่ระบบบริหารงาน TMK Curtains LEAD ขอให้วันนี้เป็นวันที่ดีของคุณนะครับ 🚀
        </p>

        <button 
          onClick={closeWelcome}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
        >
          เริ่มต้นทำงาน
        </button>
      </div>

      <style jsx global>{`
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.8) translateY(20px); }
          50% { opacity: 1; transform: scale(1.05) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
