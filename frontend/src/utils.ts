import { state, CURRENCIES } from './state';

export const formatCurrency = (val: number) => {
    // @ts-ignore
    const symbol = CURRENCIES[state.currency] || state.currency;
    return `${symbol}${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const getCycleStatus = (cycleDateStr: string | null, currentDate: Date) => {
    if (!cycleDateStr) return { status: 'na', color: 'bg-slate-200', text: 'N/A', width: '0%', label: 'N/A', statusText: 'N/A', daysLeft: 0 };
    const cycleDay = new Date(cycleDateStr).getDate();
    const currentDay = currentDate.getDate();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    let daysPassed = currentDay - cycleDay;
    if (daysPassed < 0) daysPassed += daysInMonth;

    if (daysPassed <= 10) return { status: 'great', color: 'bg-emerald-500', label: 'Great Timing', width: '15%', statusText: 'Great Timing', daysLeft: 0 };
    if (daysPassed <= 20) return { status: 'good', color: 'bg-yellow-500', label: 'Good Timing', width: '50%', statusText: 'Good Timing', daysLeft: 0 };
    return { status: 'poor', color: 'bg-rose-500', label: 'Cycle Ending Soon', width: '90%', statusText: 'Cycle Ending Soon', daysLeft: 0 };
};
