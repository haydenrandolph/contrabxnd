'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import ToolPage from '@/components/ToolPage';
import SatsConverter from '@/components/toolkit/SatsConverter';

export default function ConverterPage() {
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
      slug="converter"
      title="Sats Converter"
      subtitle="Convert between USD and satoshis at the live exchange rate."
    >
      <SatsConverter isLightMode={isLightMode} currentPrice={currentPrice} />
    </ToolPage>
  );
}
