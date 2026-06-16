import * as cheerio from 'cheerio';
import type { EtfSnapshot } from './types';

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

export async function scrapeARKB(): Promise<EtfSnapshot | null> {
  try {
    const res = await fetch(
      'https://staging-market-data-api.21shares.com/market-data-api/v4/product_valuation_history/arkb',
      { headers: { 'Accept': 'application/json', 'User-Agent': BROWSER_UA }, cache: 'no-store' },
    );

    if (!res.ok) throw new Error(`21Shares API ${res.status}`);

    const data = await res.json();
    const entries = Array.isArray(data) ? data : data?.data;

    if (!entries?.length) throw new Error('No ARKB data');

    const latest = entries[0];

    return {
      ticker: 'ARKB',
      fund_name: 'ARK 21Shares Bitcoin ETF',
      date: latest.valuation_date ?? latest.date,
      nav_per_share: parseFloat(latest.nav_per_share),
      shares_outstanding: parseInt(latest.total_units_outstanding?.toString().replace(/,/g, ''), 10),
      total_net_assets: parseFloat(latest.total_nav?.toString().replace(/,/g, '')),
      market_price: latest.market_price ? parseFloat(latest.market_price) : null,
      volume: latest.daily_trading_volume ? parseInt(latest.daily_trading_volume?.toString().replace(/,/g, ''), 10) : null,
      premium_discount: latest.premium_discount ? parseFloat(latest.premium_discount) : null,
      source: '21shares',
      raw_data: latest,
    };
  } catch (err) {
    console.error('ARKB scrape failed:', err);
    return null;
  }
}

export async function scrapeIBIT(): Promise<EtfSnapshot | null> {
  try {
    const res = await fetch(
      'https://www.ishares.com/us/products/333011/ishares-bitcoin-trust',
      { headers: { 'User-Agent': BROWSER_UA, 'Accept': 'text/html' }, cache: 'no-store' },
    );

    if (!res.ok) throw new Error(`BlackRock page ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    const extractText = (selector: string): string | null => {
      const el = $(selector);
      return el.length ? el.text().trim() : null;
    };

    const extractByDataId = (dataId: string): string | null => {
      const el = $(`[data-id="${dataId}"]`);
      return el.length ? el.text().trim() : null;
    };

    const parseNum = (s: string | null): number | null => {
      if (!s) return null;
      // BlackRock duplicates values (e.g. "$37.75$37.75"), take just the first
      const deduped = s.replace(/(\$[\d,.]+)\1+/, '$1');
      const cleaned = deduped.replace(/[$,%\s]/g, '').replace(/,/g, '');
      const n = parseFloat(cleaned);
      return isNaN(n) ? null : n;
    };

    const parseBigNum = (s: string | null): number | null => {
      if (!s) return null;
      const deduped = s.replace(/(\$[\d,.]+)\1+/, '$1');
      const cleaned = deduped.replace(/[$\s]/g, '').replace(/,/g, '');
      const n = parseFloat(cleaned);
      return isNaN(n) ? null : n;
    };

    const navText = extractByDataId('fundHeader-navAmount-data')
      ?? extractText('.fund-header-nav .header-nav-data');

    const sharesText = extractByDataId('keyFundFacts-sharesOutstanding-data')
      ?? extractText('[data-col="sharesOutstanding"]');

    const totalAssetsText = extractByDataId('keyFundFacts-totalNetAssetsFundLevel-data')
      ?? extractText('[data-col="totalNetAssets"]');

    const priceText = extractByDataId('keyFundFacts-closingPrice-data')
      ?? extractText('[data-col="closingPrice"]');

    const volumeText = extractByDataId('keyFundFacts-consolidatedVolume-data')
      ?? extractText('[data-col="consolidatedVolume"]');

    const premiumText = extractByDataId('keyFundFacts-premiumDiscountClosingPriceNavPercent-data');

    const navPerShare = parseNum(navText);
    const sharesOutstanding = parseBigNum(sharesText);
    const totalNetAssets = parseBigNum(totalAssetsText);

    if (!navPerShare || !sharesOutstanding) {
      const jsonInput = $('input.dcr-data');
      if (jsonInput.length) {
        const raw = jsonInput.attr('value');
        if (raw) {
          try {
            const decoded = raw.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
            const parsed = JSON.parse(decoded);
            return {
              ticker: 'IBIT',
              fund_name: 'iShares Bitcoin Trust',
              date: parsed.asOfDate ?? new Date().toISOString().split('T')[0],
              nav_per_share: parseFloat(parsed.navAmount ?? parsed.fundNav?.navAmount),
              shares_outstanding: parseInt(parsed.sharesOutstanding?.toString().replace(/,/g, ''), 10),
              total_net_assets: parseFloat(parsed.totalNetAssetsFundLevel?.toString().replace(/,/g, '')),
              market_price: parsed.closingPrice ? parseFloat(parsed.closingPrice) : null,
              volume: parsed.consolidatedVolume ? parseInt(parsed.consolidatedVolume.toString().replace(/,/g, ''), 10) : null,
              premium_discount: parsed.premiumDiscountClosingPriceNavPercent ? parseFloat(parsed.premiumDiscountClosingPriceNavPercent) : null,
              source: 'blackrock',
              raw_data: parsed,
            };
          } catch { /* continue with partial data */ }
        }
      }

      if (!navPerShare) throw new Error('Could not extract IBIT NAV');
    }

    const today = new Date().toISOString().split('T')[0];

    return {
      ticker: 'IBIT',
      fund_name: 'iShares Bitcoin Trust',
      date: today,
      nav_per_share: navPerShare,
      shares_outstanding: sharesOutstanding ?? 0,
      total_net_assets: totalNetAssets ?? (navPerShare * (sharesOutstanding ?? 0)),
      market_price: parseNum(priceText),
      volume: parseBigNum(volumeText),
      premium_discount: parseNum(premiumText),
      source: 'blackrock',
      raw_data: {
        navText, sharesText, totalAssetsText, priceText, volumeText, premiumText,
      },
    };
  } catch (err) {
    console.error('IBIT scrape failed:', err);
    return null;
  }
}

export async function scrapeAll(): Promise<EtfSnapshot[]> {
  const results = await Promise.allSettled([scrapeARKB(), scrapeIBIT()]);
  return results
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter((s): s is EtfSnapshot => s !== null);
}
