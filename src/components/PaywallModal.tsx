"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import UpgradeButton from "./UpgradeButton";
import { useState } from "react";
import AuthModal from "./AuthModal";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showAuth, setShowAuth] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
        <div className="bg-white rounded-lg max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {t('paywall.title')}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('paywall.description')}
          </p>

          <div className="space-y-3">
            {user ? (
              <UpgradeButton />
            ) : (
              <>
                <button
                  onClick={() => setShowAuth(true)}
                  className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium text-sm"
                >
                  {t('paywall.loginToUpgrade')}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  {t('paywall.loginHint')}
                </p>
              </>
            )}

            <button
              onClick={onClose}
              className="w-full py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm"
            >
              {t('paywall.close')}
            </button>
          </div>
        </div>
      </div>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
