"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ManageSubscriptionButton() {
  const { user, isPro } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  if (!user || !isPro) return null;

  const handleManage = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      console.error('Failed to create portal session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleManage}
      disabled={loading}
      className="w-full py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 text-sm"
    >
      {loading ? '...' : t('subscription.manage')}
    </button>
  );
}
