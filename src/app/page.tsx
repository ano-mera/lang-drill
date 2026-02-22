"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import RandomPassage from "@/components/RandomPassage";
import SplashScreen from "@/components/SplashScreen";
import { LanguageProvider } from "@/contexts/LanguageContext";

function HomeContent() {
  const searchParams = useSearchParams();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // URLに問題IDが指定されている場合はスプラッシュ画面をスキップ
    const hasId = searchParams?.get('id');
    if (hasId) {
      setShowSplash(false);
    }
  }, [searchParams]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };


  // 管理者機能を本番環境では無効化
  const showAdminButton = process.env.NODE_ENV === "development";

  return (
    <LanguageProvider>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className="relative">
        {showAdminButton && (
          <Link
            href="/admin"
            className="absolute top-4 right-4 z-10 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Admin
          </Link>
        )}
        <Suspense fallback={<div>Loading...</div>}>
          <RandomPassage onShowSplash={() => setShowSplash(true)} />
        </Suspense>
      </div>
    </LanguageProvider>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
