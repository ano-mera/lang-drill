"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import AuthModal from "./AuthModal";

export default function AuthButton() {
  const { user, signOut, isLoading } = useAuth();
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);

  if (isLoading) return null;

  if (user) {
    return (
      <button
        onClick={signOut}
        className="h-10 px-3 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm"
        title={t('auth.logout')}
      >
        {t('auth.logout')}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="h-10 px-3 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm font-bold"
      >
        {t('auth.login')}
      </button>
      <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
