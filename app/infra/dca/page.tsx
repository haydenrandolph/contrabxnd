'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import ToolPage from '@/components/ToolPage';
import DCACalculator from '@/components/toolkit/DCACalculator';

export default function DCAPage() {
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
      slug="dca"
      title="DCA Calculator"
      subtitle="Simulate dollar-cost averaging returns over any historical period."
    >
      <DCACalculator isLightMode={isLightMode} currentPrice={currentPrice} />
    </ToolPage>
  );
}
