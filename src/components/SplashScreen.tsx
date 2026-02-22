"use client";

import { useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isFading, setIsFading] = useState(false);

  const handleEnter = () => {
    setIsFading(true);
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-black z-50 transition-opacity duration-500 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
      style={{
        fontFamily: "Helvetica, Arial, sans-serif",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="text-center text-white flex flex-col items-center">
        <img src="/icon-512x512.png" alt="LangDrill" className="w-[10rem] h-[10rem] rounded-3xl mb-4" />
        <p className="text-base text-gray-300 mt-2">AI-powered English proficiency training</p>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">Practice listening, reading, and grammar with AI-generated drills designed for the TOEIC exam — the global standard for business English.</p>
      </div>
      <button
        onClick={handleEnter}
        className="mt-16 px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
      >
        Enter
      </button>
    </div>
  );
}
