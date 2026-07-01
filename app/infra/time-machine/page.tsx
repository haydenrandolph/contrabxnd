'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import ToolPage from '@/components/ToolPage';
import PurchasingPowerComparison from '@/components/toolkit/PurchasingPowerComparison';

export default function TimeMachinePage() {
  const [currentPrice, setCurrentPrice] = useState(0);
  const { isLightMode } = useTheme();

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/price');
        if (res.ok) {
          const data = await res.json();
          setCurrentPrice(data.price ?? 0);
        }
      } catch { /* ignore */ }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ToolPage
      breadcrumb="Time Machine"
      title="Time Machine"
      subtitle="See what your money would be worth if you had bought Bitcoin."
    >
      <PurchasingPowerComparison isLightMode={isLightMode} currentPrice={currentPrice} />
    </ToolPage>
  );
}
