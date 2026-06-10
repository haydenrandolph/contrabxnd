// Monthly BTC closing prices (USD) from 2013 to present.
// Source: historical records. Used as fallback and for long-range calculations.
// Format: [year, month (1-indexed), price]
const MONTHLY_PRICES: [number, number, number][] = [
  // 2013
  [2013, 4, 135], [2013, 5, 128], [2013, 6, 97], [2013, 7, 105],
  [2013, 8, 129], [2013, 9, 140], [2013, 10, 198], [2013, 11, 1075],
  [2013, 12, 732],
  // 2014
  [2014, 1, 800], [2014, 2, 550], [2014, 3, 451], [2014, 4, 450],
  [2014, 5, 629], [2014, 6, 640], [2014, 7, 586], [2014, 8, 478],
  [2014, 9, 387], [2014, 10, 338], [2014, 11, 378], [2014, 12, 314],
  // 2015
  [2015, 1, 217], [2015, 2, 254], [2015, 3, 244], [2015, 4, 236],
  [2015, 5, 237], [2015, 6, 257], [2015, 7, 286], [2015, 8, 230],
  [2015, 9, 236], [2015, 10, 327], [2015, 11, 377], [2015, 12, 430],
  // 2016
  [2016, 1, 378], [2016, 2, 437], [2016, 3, 416], [2016, 4, 454],
  [2016, 5, 530], [2016, 6, 673], [2016, 7, 624], [2016, 8, 572],
  [2016, 9, 609], [2016, 10, 695], [2016, 11, 740], [2016, 12, 952],
  // 2017
  [2017, 1, 970], [2017, 2, 1190], [2017, 3, 1050], [2017, 4, 1348],
  [2017, 5, 2300], [2017, 6, 2500], [2017, 7, 2875], [2017, 8, 4700],
  [2017, 9, 4340], [2017, 10, 6468], [2017, 11, 10975], [2017, 12, 13860],
  // 2018
  [2018, 1, 10166], [2018, 2, 10685], [2018, 3, 6973], [2018, 4, 9240],
  [2018, 5, 7488], [2018, 6, 6394], [2018, 7, 7729], [2018, 8, 7012],
  [2018, 9, 6602], [2018, 10, 6317], [2018, 11, 3869], [2018, 12, 3693],
  // 2019
  [2019, 1, 3457], [2019, 2, 3784], [2019, 3, 4105], [2019, 4, 5269],
  [2019, 5, 8574], [2019, 6, 10817], [2019, 7, 9590], [2019, 8, 9600],
  [2019, 9, 8293], [2019, 10, 9199], [2019, 11, 7569], [2019, 12, 7193],
  // 2020
  [2020, 1, 9350], [2020, 2, 8778], [2020, 3, 6424], [2020, 4, 8624],
  [2020, 5, 9455], [2020, 6, 9137], [2020, 7, 11351], [2020, 8, 11655],
  [2020, 9, 10776], [2020, 10, 13805], [2020, 11, 19698], [2020, 12, 29002],
  // 2021
  [2021, 1, 33114], [2021, 2, 45240], [2021, 3, 58918], [2021, 4, 57750],
  [2021, 5, 37332], [2021, 6, 35041], [2021, 7, 41461], [2021, 8, 47166],
  [2021, 9, 43790], [2021, 10, 61318], [2021, 11, 56906], [2021, 12, 46306],
  // 2022
  [2022, 1, 38483], [2022, 2, 43192], [2022, 3, 45538], [2022, 4, 37714],
  [2022, 5, 31793], [2022, 6, 19785], [2022, 7, 23297], [2022, 8, 20050],
  [2022, 9, 19423], [2022, 10, 20495], [2022, 11, 17167], [2022, 12, 16547],
  // 2023
  [2023, 1, 23139], [2023, 2, 23147], [2023, 3, 28478], [2023, 4, 29252],
  [2023, 5, 27220], [2023, 6, 30477], [2023, 7, 29233], [2023, 8, 26044],
  [2023, 9, 26972], [2023, 10, 34494], [2023, 11, 37732], [2023, 12, 42265],
  // 2024
  [2024, 1, 42580], [2024, 2, 61148], [2024, 3, 71290], [2024, 4, 60667],
  [2024, 5, 67472], [2024, 6, 62714], [2024, 7, 66656], [2024, 8, 59013],
  [2024, 9, 63329], [2024, 10, 72390], [2024, 11, 96405], [2024, 12, 93354],
  // 2025
  [2025, 1, 102410], [2025, 2, 84350], [2025, 3, 82540], [2025, 4, 94181],
  [2025, 5, 103262],
];

export interface PricePoint {
  date: string; // YYYY-MM-DD
  price: number;
}

let _sorted: PricePoint[] | null = null;

function getSorted(): PricePoint[] {
  if (!_sorted) {
    _sorted = MONTHLY_PRICES.map(([y, m, p]) => ({
      date: `${y}-${String(m).padStart(2, '0')}-01`,
      price: p,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }
  return _sorted;
}

export function getStaticPriceOnDate(dateStr: string): number | null {
  const points = getSorted();
  let best: PricePoint | null = null;
  for (const pt of points) {
    if (pt.date <= dateStr) best = pt;
    else break;
  }
  return best?.price ?? null;
}

export function getStaticPricesInRange(from: string, to: string): PricePoint[] {
  return getSorted().filter((p) => p.date >= from && p.date <= to);
}

export function interpolateDailyPrices(from: string, to: string): PricePoint[] {
  const monthly = getSorted();
  const result: PricePoint[] = [];
  const start = new Date(from + 'T00:00:00Z');
  const end = new Date(to + 'T00:00:00Z');

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const ds = d.toISOString().slice(0, 10);
    let before: PricePoint | null = null;
    let after: PricePoint | null = null;
    for (const pt of monthly) {
      if (pt.date <= ds) before = pt;
      if (pt.date >= ds && !after) after = pt;
    }
    if (before && after && before !== after) {
      const t1 = new Date(before.date + 'T00:00:00Z').getTime();
      const t2 = new Date(after.date + 'T00:00:00Z').getTime();
      const tc = d.getTime();
      const ratio = (tc - t1) / (t2 - t1);
      result.push({ date: ds, price: before.price + (after.price - before.price) * ratio });
    } else if (before) {
      result.push({ date: ds, price: before.price });
    }
  }
  return result;
}
