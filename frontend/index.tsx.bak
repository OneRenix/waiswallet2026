import './css/styles.css';
import { chatWithPilot, scanReceipt, fileToBase64 } from './services/geminiService';
import { CardData, Transaction } from './types';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize AI for chat context specifically if we need direct access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

declare var $: any;
declare var lucide: any;
declare var webkitSpeechRecognition: any;

// --- Global State ---
const state = {
    currentView: 'dashboard',
    currentDate: new Date("2026-01-24"), // Will update dynamic logic for display
    reportDate: new Date("2026-01-24"), // Specific date for Reports view
    currency: 'PHP',
    country: 'Philippines',
    entryType: 'expense', // 'expense' | 'income'
    historyView: {
        mode: 'monthly', // 'daily' | 'monthly' | 'yearly'
        date: new Date("2026-01-24"),
        filter: 'all' // 'all' | 'income' | 'expense'
    },
    cards: [
        {
            id: 1, name: "Amore Cashback", provider: "BPI", balance: 15450.00, limit: 150000.00,
            dueDate: "2026-02-05", cycleDate: "2026-01-26", color: "bg-rose-700",
            benefits: { groceries: 0.04, drugstores: 0.01, utilities: 0.01, default: 0.003 },
            type: "credit", cashbackCap: 15000, cashbackYTD: 250, icon: "heart"
        },
        {
            id: 2, name: "Visa Platinum", provider: "EastWest", balance: 42300.50, limit: 300000.00,
            dueDate: "2026-01-28", cycleDate: "2026-01-15", color: "bg-slate-700",
            benefits: { dining: 0.0888, travel: 0.0888, utilities: 0.0888, fuel: 0.0888, shopping: 0.0888, default: 0.003 },
            type: "credit", cashbackCap: 15000, cashbackYTD: 1000, icon: "platinum"
        },
        {
            id: 3, name: "Everyday Debit", provider: "UnionBank", balance: 28500.00, limit: null,
            dueDate: null, cycleDate: null, color: "bg-orange-500",
            benefits: { default: 0.0 }, type: "debit", cashbackCap: null, cashbackYTD: 0, icon: "wallet"
        },
        {
            id: 4, name: "Cash on Hand", provider: "Physical Wallet", balance: 3200.00, limit: null,
            dueDate: null, cycleDate: null, color: "bg-emerald-600",
            benefits: { default: 0.0 }, type: "cash", cashbackCap: null, cashbackYTD: 0, icon: "cash"
        }
    ] as CardData[],
    transactions: [
        { id: 1, merchant: "Landers Superstore", amount: 6500, category: "groceries", date: "2026-01-23", cardId: 1, type: "straight", cashback: 260 },
        { id: 2, merchant: "Wildflour Cafe", amount: 1240, category: "dining", date: "2026-01-23", cardId: 2, type: "straight", cashback: 110.11 },
        { id: 3, merchant: "Meralco", amount: 3200, category: "utilities", date: "2026-01-22", cardId: 2, type: "straight", cashback: 284.16 },
        { id: 4, merchant: "Abenson", amount: 12000, category: "shopping", date: "2026-01-10", cardId: 1, type: "installment", installments: "12mo", cashback: 36 }, 
        { id: 5, merchant: "Shell Station", amount: 2500, category: "fuel", date: "2026-01-05", cardId: 2, type: "straight", cashback: 222 },
        { id: 6, merchant: "Spotify", amount: 129, category: "others", date: "2026-01-01", cardId: 2, type: "straight", cashback: 0.38 },
        { id: 7, merchant: "Payroll", amount: 40000, category: "income", date: "2026-01-15", cardId: 3, type: "credit", cashback: 0 },
        { id: 8, merchant: "Freelance Project", amount: 15000, category: "income", date: "2026-01-20", cardId: 3, type: "credit", cashback: 0 },
    ] as Transaction[],
    goals: [
        { id: 1, name: "Emergency Fund", target: 150000, current: 85000, color: "bg-emerald-500", icon: "shield", sourceId: 3 },
        { id: 2, name: "Japan Trip 2026", target: 100000, current: 25000, color: "bg-purple-500", icon: "plane", sourceId: 3 },
        { id: 3, name: "New Laptop", target: 80000, current: 12000, color: "bg-blue-500", icon: "laptop", sourceId: 4 }
    ],
    categories: [
        { id: 'groceries', label: 'Groceries', color: 'text-green-600', bg: 'bg-green-100', fill: 'fill-green-500', icon: 'shopping-cart' },
        { id: 'dining', label: 'Dining', color: 'text-orange-600', bg: 'bg-orange-100', fill: 'fill-orange-500', icon: 'utensils' },
        { id: 'fuel', label: 'Fuel', color: 'text-red-600', bg: 'bg-red-100', fill: 'fill-red-500', icon: 'fuel' },
        { id: 'utilities', label: 'Utilities', color: 'text-blue-600', bg: 'bg-blue-100', fill: 'fill-blue-500', icon: 'zap' },
        { id: 'travel', label: 'Travel', color: 'text-purple-600', bg: 'bg-purple-100', fill: 'fill-purple-500', icon: 'plane' },
        { id: 'shopping', label: 'Shopping', color: 'text-pink-600', bg: 'bg-pink-100', fill: 'fill-pink-500', icon: 'shopping-bag' },
        { id: 'others', label: 'Others', color: 'text-slate-600', bg: 'bg-slate-100', fill: 'fill-slate-500', icon: 'circle-ellipsis' },
        { id: 'income', label: 'Income', color: 'text-emerald-600', bg: 'bg-emerald-100', fill: 'fill-emerald-500', icon: 'banknote' }
    ],
    recommendations: [
        { id: 1, type: 'priority', title: 'Emergency Fund First', desc: 'Ensure your emergency fund covers at least 3 months of expenses before aggressive investing.', icon: 'shield-alert', color: 'bg-white/10' },
        { id: 2, type: 'tip', title: 'Maximize Float', desc: 'Use your EastWest card for dining today to delay payment by ~30 days.', icon: 'credit-card', color: 'bg-white/10' },
        { id: 3, type: 'due', title: 'Payment Due in 4 Days', desc: 'Visa Platinum. Maintain your credit health by paying on time.', amount: '42300.50', icon: 'alert-circle', color: 'bg-rose-500/20' },
        { id: 4, type: 'tip', title: 'Switch Grocery Day', desc: 'Landers offers 5% off on Mondays. You shopped on Friday.', icon: 'calendar', color: 'bg-white/10' },
        { id: 5, type: 'opportunity', title: 'Invest Surplus', desc: 'You have 15k surplus this month. Consider putting it into MP2 for higher yield.', icon: 'trending-up', color: 'bg-white/10' },
        { id: 6, type: 'warning', title: 'Dining Budget', desc: 'You are at 80% of your dining budget with 10 days left.', icon: 'alert-triangle', color: 'bg-amber-500/20' }
    ],
    categoryBudgets: {
        groceries: 18000, dining: 8000, fuel: 6000, utilities: 10000,
        travel: 8000, shopping: 10000, others: 5000
    },
    messages: [
        { id: 1, sender: 'buddy', text: "Hi! I'm WaisWallet, your strategic financial co-pilot. I'm here to help you navigate your spending and hit your savings goals. What's on your mind?", feedback: null }
    ],
    simData: {
        amount: '', cardId: 1, category: 'shopping', paymentType: 'straight',
        installments: '3', urgency: 'now', goalId: ''
    }
};

const COUNTRIES = ['Philippines', 'United States', 'Japan', 'United Kingdom', 'Australia', 'Canada', 'Singapore'];
const CURRENCIES = {
    'PHP': '₱',
    'USD': '$',
    'EUR': '€',
    'JPY': '¥',
    'GBP': '£',
    'AUD': 'A$',
    'CAD': 'C$',
    'SGD': 'S$'
};

// --- Helper Functions ---

const formatCurrency = (val: number) => {
    // @ts-ignore
    const symbol = CURRENCIES[state.currency] || state.currency;
    return `${symbol}${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const getCycleStatus = (cycleDateStr: string | null, currentDate: Date) => {
    if (!cycleDateStr) return { status: 'na', color: 'bg-slate-200', text: 'N/A', width: '0%', label: 'N/A', statusText: 'N/A', daysLeft: 0 };
    const cycleDay = new Date(cycleDateStr).getDate();
    const currentDay = currentDate.getDate();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    let daysPassed = currentDay - cycleDay;
    if (daysPassed < 0) daysPassed += daysInMonth;
    
    // Cycle logic simulation
    
    if (daysPassed <= 10) return { status: 'great', color: 'bg-emerald-500', label: 'Great Timing', width: '15%', statusText: 'Great Timing', daysLeft: 0 };
    if (daysPassed <= 20) return { status: 'good', color: 'bg-yellow-500', label: 'Good Timing', width: '50%', statusText: 'Good Timing', daysLeft: 0 };
    return { status: 'poor', color: 'bg-rose-500', label: 'Cycle Ending Soon', width: '90%', statusText: 'Cycle Ending Soon', daysLeft: 0 };
};

// --- DOM Rendering ---

const renderPieChart = (data: any[], total: number, isDonut = false) => {
    if(total === 0) return `<div class="text-center text-slate-400 p-4">No data available</div>`;

    let cumulativePercent = 0;
    const slices = data.map(slice => {
        const startPercent = cumulativePercent;
        const slicePercent = slice.value / total;
        cumulativePercent += slicePercent;
        const endPercent = cumulativePercent;
        
        const x = Math.cos(2 * Math.PI * startPercent);
        const y = Math.sin(2 * Math.PI * startPercent);
        const endX = Math.cos(2 * Math.PI * endPercent);
        const endY = Math.sin(2 * Math.PI * endPercent);
        const largeArc = slicePercent > 0.5 ? 1 : 0;
        
        const pathData = slicePercent >= 0.999
            ? `M 1 0 A 1 1 0 1 1 -1 0 A 1 1 0 1 1 1 0 Z`
            : `M ${x} ${y} A 1 1 0 ${largeArc} 1 ${endX} ${endY} L 0 0`;
            
        return `<path d="${pathData}" class="pie-slice ${slice.fill}" data-val="${formatCurrency(slice.value)}" data-label="${slice.label}"></path>`;
    }).join('');

    return `
    <div class="flex flex-col items-center animate-zoom-in">
        <div class="relative w-56 h-56">
            <svg viewBox="-1.2 -1.2 2.4 2.4" class="w-full h-full -rotate-90">
                ${slices}
                <!-- Donut Hole -->
                <circle cx="0" cy="0" r="${isDonut ? 0.65 : 0.65}" class="fill-white"></circle>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span class="text-xs text-slate-500">Total</span>
                <span class="text-xl font-bold text-slate-900">${formatCurrency(total)}</span>
            </div>
        </div>
        <div class="mt-6 flex flex-wrap justify-center gap-3">
            ${data.map(d => `<div class="flex items-center gap-1.5 text-xs font-medium text-slate-600"><span class="w-3 h-3 rounded-full ${d.bg}"></span>${d.label} (${Math.round((d.value/total)*100)}%)</div>`).join('')}
        </div>
    </div>`;
};

// --- View Renderers ---

const renderDashboard = () => {
    // Only count expenses for the dashboard summary
    const totalIncome = state.transactions.filter(t => t.category === 'income').reduce((a, t) => a + t.amount, 0);
    const totalExpenses = state.transactions.filter(t => t.category !== 'income').reduce((a, t) => a + t.amount, 0);
    const totalCashback = state.cards.reduce((a, c) => a + c.cashbackYTD, 0);
    // @ts-ignore
    const totalBudget = Object.values(state.categoryBudgets).reduce((a, b) => a + (b as number), 0);
    
    // Dynamic Date Header
    const dateHeader = state.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();

    // Calculate category spending for progress bars
    const catSpending: Record<string, number> = {};
    state.transactions.filter(t => t.category !== 'income').forEach(t => {
        catSpending[t.category] = (catSpending[t.category] || 0) + t.amount;
    });

    // Overview Cards - Updated labels and styling
    const overviewHtml = `
    <div class="mb-8 animate-slide-in">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">${dateHeader} OVERVIEW</p>
        <div class="grid grid-cols-3 gap-2 md:gap-4">
            <div class="bg-emerald-50/50 p-2 md:p-3 rounded-2xl border border-emerald-100 flex flex-col justify-center">
                <div class="flex items-center gap-2 mb-1">
                    <div class="hidden md:block p-1.5 bg-emerald-100 rounded-lg text-emerald-600"><i data-lucide="arrow-up-right" class="w-3 h-3"></i></div>
                    <p class="text-[10px] font-bold text-emerald-600 uppercase">Total Income</p>
                </div>
                <p class="text-sm md:text-2xl font-black text-slate-900 truncate">${formatCurrency(totalIncome)}</p>
            </div>
            <div class="bg-rose-50/50 p-2 md:p-3 rounded-2xl border border-rose-100 flex flex-col justify-center">
                <div class="flex items-center gap-2 mb-1">
                    <div class="hidden md:block p-1.5 bg-rose-100 rounded-lg text-rose-600"><i data-lucide="arrow-down-right" class="w-3 h-3"></i></div>
                    <p class="text-[10px] font-bold text-rose-600 uppercase">Total Expenses</p>
                </div>
                <p class="text-sm md:text-2xl font-black text-slate-900 truncate">${formatCurrency(totalExpenses)}</p>
            </div>
            <div class="bg-amber-50/50 p-2 md:p-3 rounded-2xl border border-amber-100 flex flex-col justify-center">
                <div class="flex items-center gap-2 mb-1">
                    <div class="hidden md:block p-1.5 bg-amber-100 rounded-lg text-amber-600"><i data-lucide="coins" class="w-3 h-3"></i></div>
                    <p class="text-[10px] font-bold text-amber-600 uppercase">Estimated Cashback</p>
                </div>
                <p class="text-sm md:text-2xl font-black text-slate-900 truncate">${formatCurrency(totalCashback)}</p>
            </div>
        </div>
    </div>`;

    // AI Recommendations
    const recHtml = `
    <section class="mb-8 animate-slide-in" style="animation-delay: 0.1s">
        <div class="bg-gradient-to-br from-blue-700 to-indigo-800 text-white p-6 rounded-2xl relative overflow-hidden shadow-xl group">
            <div class="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors duration-500"></div>
            <div class="relative z-10">
                <div class="flex items-center gap-2 mb-6">
                    <i data-lucide="sparkles" class="text-yellow-400 fill-current"></i>
                    <h2 class="text-xl font-bold">Strategic Recommendations</h2>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                     ${state.recommendations.slice(0, 3).map(rec => `
                     <div class="${rec.color} backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-colors cursor-pointer recommendation-card flex flex-col justify-between h-full" data-title="${rec.title}" data-desc="${rec.desc}">
                        <div>
                            <div class="flex items-start justify-between mb-2">
                                <i data-lucide="${rec.icon}" class="${rec.type === 'due' ? 'text-rose-200' : 'text-indigo-200'} w-5 h-5"></i>
                                <span class="text-[10px] font-bold ${rec.type === 'due' ? 'bg-rose-500' : 'bg-white/20'} px-2 py-0.5 rounded text-white shadow-sm uppercase">${rec.type}</span>
                            </div>
                            <h4 class="font-bold text-sm text-white mb-1">${rec.title}</h4>
                            ${rec.amount ? `<p class="text-lg font-black text-white mt-1">${rec.amount}</p>` : ''}
                            <p class="text-xs ${rec.type === 'due' ? 'text-rose-100' : 'text-indigo-100'} opacity-90 leading-relaxed">${rec.desc}</p>
                        </div>
                     </div>
                     `).join('')}
                </div>
                <div class="text-center mt-4">
                    <button class="text-xs font-bold text-indigo-200 hover:text-white transition-colors uppercase tracking-wider" id="btn-see-all-recs">See All Recommendations</button>
                </div>
            </div>
        </div>
    </section>`;

    // Budget Navigator Logic
    const catHtml = state.categories.slice(0, 7).map(cat => {
        if(cat.id === 'income') return '';
        // @ts-ignore
        const budget = state.categoryBudgets[cat.id] || 1;
        const spent = catSpending[cat.id] || 0;
        const pctSpent = Math.min((spent / budget) * 100, 100);
        const isOver = spent > budget;
        
        return `
        <div class="mb-2">
            <div class="flex justify-between items-end mb-1.5">
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full ${cat.bg.replace('100', '500')}"></span>
                    <span class="text-sm font-bold text-slate-700">${cat.label}</span>
                </div>
                <div class="text-right flex items-center gap-2">
                     <span class="text-xs font-bold ${isOver ? 'text-rose-500' : 'text-slate-500'}">${Math.round(pctSpent)}%</span>
                     <span class="text-[10px] font-bold text-slate-400">|</span>
                     <div class="text-[10px] font-bold text-slate-400">${formatCurrency(spent)} / ${formatCurrency(budget)}</div>
                </div>
            </div>
            <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full ${isOver ? 'bg-rose-500' : cat.bg.replace('bg-', 'bg-').replace('100', '500')}" style="width: ${pctSpent}%"></div>
            </div>
        </div>`;
    }).join('');

    // Goals for Dashboard - Truncated to Top 2
    const goalsHtml = `
    <div class="mt-8 border-t border-slate-100 pt-6">
        <h3 class="font-bold text-md text-slate-900 mb-4 flex items-center gap-2"><i data-lucide="target" class="w-4 h-4 text-blue-500"></i> Financial Goals</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${state.goals.slice(0, 2).map(g => {
                const pct = Math.min((g.current / g.target) * 100, 100);
                return `
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                            <div class="p-1.5 ${g.color} bg-opacity-20 rounded-lg text-${g.color.replace('bg-', '')}">
                                <i data-lucide="${g.icon}" class="w-3 h-3"></i>
                            </div>
                            <span class="text-xs font-bold text-slate-700">${g.name}</span>
                        </div>
                        <span class="text-[10px] font-bold text-slate-500">${pct.toFixed(0)}%</span>
                    </div>
                    <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div class="h-full ${g.color}" style="width: ${pct}%"></div>
                    </div>
                    <div class="flex justify-between mt-1 text-[10px] text-slate-400">
                        <span>${formatCurrency(g.current)}</span>
                        <span>${formatCurrency(g.target)}</span>
                    </div>
                </div>`;
            }).join('')}
        </div>
        <div class="text-center mt-4">
            <button class="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider" id="btn-view-goals">View All Goals</button>
        </div>
    </div>`;

    const budgetHtml = `
    <section class="mb-8 animate-slide-in" style="animation-delay: 0.2s">
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div class="flex justify-between items-start mb-6">
                <div class="flex items-center gap-3">
                    <div class="p-2.5 bg-blue-100 rounded-full text-blue-600"><i data-lucide="bar-chart-3"></i></div>
                    <div><h2 class="text-lg font-bold">Budgets</h2><p class="text-xs text-slate-500">Monthly limits</p></div>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-black text-slate-900">${formatCurrency(totalExpenses)} <span class="text-base font-medium text-slate-400">/ ${formatCurrency(totalBudget)}</span></p>
                </div>
            </div>
            <div class="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-8 relative">
                 <div class="absolute inset-0 bg-slate-200"></div>
                <div class="h-full bg-blue-600 rounded-full transition-all duration-1000 relative z-10" style="width: ${Math.min((totalExpenses/totalBudget)*100, 100)}%"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                ${catHtml}
            </div>
            ${goalsHtml}
        </div>
    </section>`;

    // Recent Activity List
    const txHtml = state.transactions.slice(0, 5).map(t => {
        const cardName = state.cards.find(c => c.id == t.cardId)?.name || 'Unknown';
        const isIncome = t.category === 'income';
        return `
        <div class="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer">
            <div class="flex items-center gap-3">
                <div class="p-2 ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} rounded-full"><i data-lucide="${isIncome ? 'arrow-up-right' : 'arrow-down-right'}" class="w-4 h-4"></i></div>
                <div>
                    <p class="text-sm font-bold text-slate-900">${t.merchant}</p>
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                        <span>${t.date}</span>
                        <span class="capitalize px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">${t.category}</span>
                    </div>
                </div>
            </div>
            <div class="text-right">
                <span class="block font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}">${isIncome ? '+' : '-'}${formatCurrency(t.amount)}</span>
                <span class="text-[10px] text-slate-400">${cardName}</span>
            </div>
        </div>`;
    }).join('');

    const activityHtml = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-in" style="animation-delay: 0.3s">
        <div class="lg:col-span-2 space-y-6">
             <div class="flex items-center justify-between mb-4">
                 <h3 class="text-lg font-bold flex items-center gap-2 text-slate-900"><i data-lucide="credit-card" class="text-blue-500"></i> Card Strategy</h3>
                 <button class="text-xs font-bold text-blue-600 hover:text-blue-700" onclick="window.app.switchView('wallets')">Manage All</button>
             </div>
             
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                 ${state.cards.map(c => {
                    const cycle = getCycleStatus(c.cycleDate, state.currentDate);
                    // Determine accent color text based on cycle
                    let statusTextColor = 'text-slate-500';
                    if (cycle.status === 'great') statusTextColor = 'text-emerald-600';
                    if (cycle.status === 'good') statusTextColor = 'text-yellow-600';
                    if (cycle.status === 'poor') statusTextColor = 'text-rose-600';

                    return `
                    <div class="relative bg-white p-4 rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all cursor-pointer">
                      <div class="absolute left-0 top-0 bottom-0 w-1.5 ${c.color}"></div>
                      <div class="pl-3">
                         <div class="flex justify-between items-start mb-4">
                            <div>
                               <p class="text-[10px] uppercase text-slate-400 font-bold tracking-wider">${c.provider}</p>
                               <h4 class="font-bold text-slate-900 text-sm leading-tight mt-0.5">${c.name}</h4>
                            </div>
                            <div class="text-right">
                               <p class="font-black text-slate-900">${formatCurrency(c.balance)}</p>
                               ${c.limit ? `<p class="text-[10px] text-slate-400">Limit: ${formatCurrency(c.limit)}</p>` : ''}
                            </div>
                         </div>
                         ${c.type === 'credit' ? `
                         <div class="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div class="flex justify-between mb-1.5">
                               <span class="text-[10px] font-bold text-slate-500 uppercase">Cycle Health</span>
                               <span class="text-[10px] font-bold ${statusTextColor}">${cycle.statusText}</span>
                            </div>
                            <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                               <div class="h-full ${cycle.color}" style="width: ${cycle.width}"></div>
                            </div>
                            <p class="text-[10px] text-slate-400 mt-1">Concept: Credit Float</p>
                         </div>
                         ` : ''}
                      </div>
                    </div>`;
                 }).join('')}
             </div>
        </div>
        <div>
             <h3 class="text-lg font-bold flex items-center gap-2 mb-6 text-slate-900"><i data-lucide="history" class="text-rose-500"></i> Recent Transactions</h3>
             <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                ${txHtml}
                <div class="p-3 bg-slate-50 text-center border-t border-slate-100">
                    <button class="text-xs font-bold text-slate-500 hover:text-blue-600" id="btn-view-transactions">View All Transactions</button>
                </div>
             </div>
        </div>
    </div>`;

    // Search Bar
    const searchBar = `
    <div class="max-w-[650px] mx-auto w-full mb-10 animate-slide-in">
        <form class="relative form-main-chat">
            <div class="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <i data-lucide="sparkles" class="text-blue-500 animate-pulse w-5 h-5"></i>
            </div>
            <input type="text" placeholder="Ask WaisWallet about your budget, strategy, or receipts..." class="w-full pl-14 pr-16 py-4 bg-white rounded-full border-2 border-slate-200 shadow-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 transition-all placeholder:text-slate-400 main-chat-input">
            <button type="submit" class="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2.5 rounded-full shadow-md hover:bg-blue-700 transition-colors"><i data-lucide="arrow-right" class="w-5 h-5"></i></button>
        </form>
    </div>`;

    return searchBar + overviewHtml + recHtml + budgetHtml + activityHtml;
};

// ... (renderWallets, renderGoals, renderReports, renderHistory, renderSettings, renderSimulation same as before) ...
const renderWallets = () => {
    // ... same as previous ...
    const cardsHtml = state.cards.map(c => {
        const util = c.limit ? (c.balance / c.limit) * 100 : 0;
        const utilColor = util > 80 ? 'bg-rose-500' : util > 50 ? 'bg-yellow-500' : 'bg-blue-500';
        const cycle = getCycleStatus(c.cycleDate, state.currentDate);

        return `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all relative group">
            <div class="absolute top-4 right-4 flex gap-2 z-20">
                <button class="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors btn-view-wallet-tx" data-id="${c.id}" title="View Transactions">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
                <button class="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors btn-edit-wallet" data-id="${c.id}" title="Edit Wallet">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                </button>
            </div>
            <div class="h-24 ${c.color} p-4 relative bg-gradient-to-r from-transparent to-black/20">
                <i data-lucide="${c.icon}" class="text-white/20 w-16 h-16 absolute -bottom-4 -right-4 rotate-12"></i>
                <div class="relative z-10 text-white">
                    <p class="text-xs opacity-80 uppercase tracking-wider">${c.provider}</p>
                    <h3 class="font-bold text-lg">${c.name}</h3>
                </div>
            </div>
            <div class="p-5 space-y-4">
                <div class="flex justify-between items-end">
                    <div>
                        <p class="text-xs text-slate-500">Current Balance</p>
                        <p class="text-xl font-black text-slate-900">${formatCurrency(c.balance)}</p>
                    </div>
                    ${c.limit ? `
                    <div class="text-right">
                        <p class="text-xs text-slate-500">Limit: ${formatCurrency(c.limit)}</p>
                        <p class="text-xs font-bold ${util > 80 ? 'text-rose-500' : 'text-emerald-500'}">${util.toFixed(1)}% Used</p>
                    </div>` : ''}
                </div>
                
                ${c.limit ? `
                <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full ${utilColor}" style="width: ${util}%"></div>
                </div>` : ''}

                ${c.type === 'credit' ? `
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="bg-slate-50 p-2 rounded-lg">
                        <p class="text-slate-400">Statement Date</p>
                        <p class="font-bold text-slate-700">${c.cycleDate || 'N/A'}</p>
                    </div>
                    <div class="bg-slate-50 p-2 rounded-lg">
                        <p class="text-slate-400">Due Date</p>
                        <p class="font-bold text-slate-700">${c.dueDate || 'N/A'}</p>
                    </div>
                </div>
                ${c.cycleDate ? `
                <div class="flex items-center gap-2 p-2 rounded-lg ${cycle.color}/10 border border-${cycle.color.replace('bg-', '')}/20">
                    <div class="w-2 h-2 rounded-full ${cycle.color}"></div>
                    <p class="text-xs font-bold text-slate-600 flex-1">${cycle.label}</p>
                    <span class="text-[10px] opacity-70">Strategic Timing</span>
                </div>` : ''}
                ` : ''}
            </div>
        </div>`;
    }).join('');

    return `
    <div class="animate-slide-in">
        <h2 class="text-2xl font-bold flex items-center gap-2 text-slate-900 mb-6">
            <i data-lucide="wallet" class="text-blue-600"></i> My Wallets
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${cardsHtml}
            <button id="btn-add-wallet" class="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all group min-h-[300px]">
                <div class="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors">
                    <i data-lucide="plus" class="w-6 h-6"></i>
                </div>
                <span class="font-bold">Add New Card</span>
            </button>
        </div>
    </div>`;
};

const renderGoals = () => {
    return `
    <div class="animate-slide-in">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold flex items-center gap-2 text-slate-900">
                <i data-lucide="target" class="text-blue-600"></i> Financial Goals
            </h2>
            <button id="btn-add-goal" class="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-blue-700 transition-colors">New Goal</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${state.goals.map(g => {
                const pct = Math.min((g.current / g.target) * 100, 100);
                // @ts-ignore
                const source = state.cards.find(c => c.id == g.sourceId);
                return `
                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group">
                    <button class="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-blue-600 transition-colors btn-edit-goal" data-id="${g.id}">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-3 ${g.color} bg-opacity-10 rounded-xl text-${g.color.replace('bg-', '')}">
                            <i data-lucide="${g.icon}"></i>
                        </div>
                        <div class="text-right mr-8">
                             <p class="text-xs text-slate-500 font-bold uppercase">Target</p>
                             <p class="font-bold text-slate-900">${formatCurrency(g.target)}</p>
                        </div>
                    </div>
                    <h3 class="font-bold text-lg text-slate-900 mb-2">${g.name}</h3>
                    <div class="flex justify-between text-xs text-slate-500 mb-2">
                        <span>${formatCurrency(g.current)} saved</span>
                        <span>${pct.toFixed(0)}%</span>
                    </div>
                    <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div class="h-full ${g.color}" style="width: ${pct}%"></div>
                    </div>
                    ${source ? `<div class="text-[10px] text-slate-400 flex items-center gap-1"><i data-lucide="arrow-right-circle" class="w-3 h-3"></i> Auto-deposit from ${source.name}</div>` : ''}
                </div>`;
            }).join('')}
        </div>
    </div>`;
};

const renderReports = () => {
    const { reportDate } = state;
    const monthYear = reportDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Calculate Stats for Report Date
    const txs = state.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === reportDate.getMonth() && d.getFullYear() === reportDate.getFullYear();
    });

    const income = txs.filter(t => t.category === 'income').reduce((a, b) => a + b.amount, 0);
    const expenses = txs.filter(t => t.category !== 'income').reduce((a, b) => a + b.amount, 0);
    const savings = Math.max(0, income - expenses);
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    // Category Breakdown
    const catData = state.categories.filter(c => c.id !== 'income').map(c => {
        const value = txs.filter(t => t.category === c.id).reduce((a, b) => a + b.amount, 0);
        return { ...c, value };
    }).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

    return `
    <div class="animate-slide-in">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold flex items-center gap-2 text-slate-900">
                <i data-lucide="pie-chart" class="text-blue-600"></i> Financial Report
            </h2>
            <div class="flex items-center gap-2 bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                <button id="btn-report-prev" class="p-1.5 hover:bg-slate-100 rounded-lg"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>
                <span class="text-sm font-bold text-slate-700 min-w-[100px] text-center">${monthYear}</span>
                <button id="btn-report-next" class="p-1.5 hover:bg-slate-100 rounded-lg"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                 <p class="text-[10px] font-bold text-slate-400 uppercase">Net Savings</p>
                 <h3 class="text-2xl font-black text-emerald-600">${formatCurrency(savings)}</h3>
                 <p class="text-xs text-slate-500 mt-1">${savingsRate.toFixed(1)}% Savings Rate</p>
             </div>
             <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                 <p class="text-[10px] font-bold text-slate-400 uppercase">Total Expenses</p>
                 <h3 class="text-2xl font-black text-rose-600">${formatCurrency(expenses)}</h3>
                 <p class="text-xs text-slate-500 mt-1">${txs.filter(t => t.category !== 'income').length} Transactions</p>
             </div>
             <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                 <p class="text-[10px] font-bold text-slate-400 uppercase">Top Category</p>
                 <h3 class="text-2xl font-black text-blue-600">${catData.length > 0 ? catData[0].label : 'N/A'}</h3>
                 <p class="text-xs text-slate-500 mt-1">${catData.length > 0 ? formatCurrency(catData[0].value) : '0'}</p>
             </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                 <h4 class="font-bold text-slate-900 mb-6 w-full text-left">Expense Breakdown</h4>
                 ${renderPieChart(catData, expenses, true)}
            </div>
            <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                 <h4 class="font-bold text-slate-900 mb-6">Category Details</h4>
                 <div class="space-y-4">
                    ${catData.map(c => `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="p-2 ${c.bg} ${c.color} rounded-lg"><i data-lucide="${c.icon}" class="w-4 h-4"></i></div>
                            <div>
                                <p class="text-sm font-bold text-slate-900">${c.label}</p>
                                <p class="text-[10px] text-slate-400">${Math.round((c.value/expenses)*100)}% of total</p>
                            </div>
                        </div>
                        <p class="font-bold text-slate-700">${formatCurrency(c.value)}</p>
                    </div>
                    `).join('')}
                    ${catData.length === 0 ? '<p class="text-center text-slate-400 text-sm">No expenses for this period.</p>' : ''}
                 </div>
            </div>
        </div>
    </div>`;
};

const renderHistory = () => {
    const { mode, date, filter } = state.historyView;
    
    let filteredTxs = state.transactions.filter(t => {
        const d = new Date(t.date);
        if(mode === 'monthly') return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
        if(mode === 'daily') return d.toDateString() === date.toDateString();
        return d.getFullYear() === date.getFullYear();
    });

    if(filter !== 'all') {
        filteredTxs = filteredTxs.filter(t => filter === 'income' ? t.category === 'income' : t.category !== 'income');
    }

    // Sort by date desc
    filteredTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const dateLabel = mode === 'monthly' ? date.toLocaleString('default', { month: 'long', year: 'numeric' }) 
                    : mode === 'daily' ? date.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })
                    : date.getFullYear().toString();

    return `
    <div class="animate-slide-in">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 class="text-2xl font-bold flex items-center gap-2 text-slate-900">
                <i data-lucide="history" class="text-blue-600"></i> Transaction History
            </h2>
            <div class="flex gap-2">
                 <button class="px-3 py-1.5 rounded-lg text-xs font-bold ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200'} transition-all btn-history-type" data-type="all">All</button>
                 <button class="px-3 py-1.5 rounded-lg text-xs font-bold ${filter === 'expense' ? 'bg-rose-500 text-white' : 'bg-white text-slate-500 border border-slate-200'} transition-all btn-history-type" data-type="expense">Expense</button>
                 <button class="px-3 py-1.5 rounded-lg text-xs font-bold ${filter === 'income' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500 border border-slate-200'} transition-all btn-history-type" data-type="income">Income</button>
            </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div class="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-3">
                <div class="flex p-1 bg-white rounded-lg shadow-sm border border-slate-200">
                    <button class="px-3 py-1 rounded-md text-xs font-bold ${mode === 'daily' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:text-slate-700'} btn-history-filter" data-mode="daily">Daily</button>
                    <button class="px-3 py-1 rounded-md text-xs font-bold ${mode === 'monthly' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:text-slate-700'} btn-history-filter" data-mode="monthly">Monthly</button>
                    <button class="px-3 py-1 rounded-md text-xs font-bold ${mode === 'yearly' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:text-slate-700'} btn-history-filter" data-mode="yearly">Yearly</button>
                </div>
                <div class="flex items-center gap-2">
                    <button id="btn-history-prev" class="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>
                    <span class="text-sm font-bold text-slate-700 min-w-[120px] text-center">${dateLabel}</span>
                    <button id="btn-history-next" class="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>
                </div>
            </div>
            
            <div class="divide-y divide-slate-100">
                ${filteredTxs.length === 0 ? `<div class="p-10 text-center text-slate-400 italic">No transactions found for this period.</div>` : 
                  filteredTxs.map(t => {
                      const isIncome = t.category === 'income';
                      const card = state.cards.find(c => c.id == t.cardId);
                      return `
                      <div class="p-4 flex items-center justify-between hover:bg-slate-50 group transition-colors">
                          <div class="flex items-center gap-4">
                              <div class="p-2.5 ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-50 text-rose-500'} rounded-full">
                                  <i data-lucide="${isIncome ? 'arrow-up-right' : 'arrow-down-right'}" class="w-5 h-5"></i>
                              </div>
                              <div>
                                  <p class="font-bold text-slate-900 text-sm">${t.merchant}</p>
                                  <div class="flex items-center gap-2 text-xs text-slate-500">
                                      <span>${t.date}</span>
                                      <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                                      <span class="capitalize">${t.category}</span>
                                      ${t.installments ? `<span class="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">${t.installments}</span>` : ''}
                                  </div>
                              </div>
                          </div>
                          <div class="text-right">
                              <p class="font-bold ${isIncome ? 'text-emerald-600' : 'text-slate-900'}">${isIncome ? '+' : '-'}${formatCurrency(t.amount)}</p>
                              <div class="flex items-center justify-end gap-2 mt-1">
                                  <span class="text-[10px] text-slate-400">${card ? card.name : 'Unknown Card'}</span>
                                  <button class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-all btn-edit-tx" data-id="${t.id}"><i data-lucide="pencil" class="w-3 h-3"></i></button>
                              </div>
                          </div>
                      </div>`;
                  }).join('')
                }
            </div>
        </div>
    </div>`;
};

const renderSettings = () => {
    return `
    <div class="animate-slide-in max-w-2xl mx-auto">
        <h2 class="text-2xl font-bold flex items-center gap-2 text-slate-900 mb-6">
            <i data-lucide="settings" class="text-blue-600"></i> Settings
        </h2>
        
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
            <div class="p-4 bg-slate-50 border-b border-slate-100">
                <h3 class="font-bold text-slate-900">General Preferences</h3>
            </div>
            <div class="p-6 space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-bold text-slate-700">Currency</p>
                        <p class="text-xs text-slate-500">Display currency for all values</p>
                    </div>
                    <select id="setting-currency" class="p-2 rounded-lg border border-slate-200 bg-white text-sm outline-none">
                        ${Object.keys(CURRENCIES).map(c => `<option value="${c}" ${state.currency === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-bold text-slate-700">Region Context</p>
                        <p class="text-xs text-slate-500">Adapts advice to local market</p>
                    </div>
                    <select id="setting-country" class="p-2 rounded-lg border border-slate-200 bg-white text-sm outline-none">
                        ${COUNTRIES.map(c => `<option value="${c}" ${state.country === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
            </div>
        </div>
        
        <div class="text-center text-xs text-slate-400 mt-10">
            WaisWallet v2.0 • Local Storage Mode
        </div>
    </div>`;
};

const renderSimulation = () => {
    return `
    <div class="space-y-6 animate-slide-in">
        <h2 class="text-2xl font-bold flex items-center gap-2 text-slate-900">
            <i data-lucide="calculator" class="text-blue-600"></i> Budget Simulator
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 class="font-bold text-slate-900">Scenario Input</h3>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Simulated Purchase (₱)</label>
                    <input type="number" id="sim-amount" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none text-lg font-bold text-slate-900" value="${state.simData.amount}" placeholder="0.00">
                </div>
                <div>
                     <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                     <select id="sim-cat" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900">
                        ${state.categories.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
                     </select>
                </div>
                <div>
                     <label class="block text-xs font-semibold text-slate-500 mb-1">Funding Source</label>
                     <select id="sim-card" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900">
                        ${state.cards.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                     </select>
                </div>
                
                <!-- New Feature: Payment Type Toggle -->
                <div>
                     <label class="block text-[10px] font-bold text-slate-500 uppercase mb-2">Payment Type</label>
                     <div class="flex gap-2">
                        <button type="button" class="btn-sim-payment flex-1 py-2 rounded-xl text-xs font-bold border transition-colors bg-blue-600 text-white border-blue-600" data-type="straight">Straight</button>
                        <button type="button" class="btn-sim-payment flex-1 py-2 rounded-xl text-xs font-bold border transition-colors bg-white text-slate-500 border-slate-200" data-type="installment">Installment</button>
                     </div>
                </div>
                
                <!-- New Feature: Installment Term -->
                <div id="sim-term-wrapper" class="hidden animate-slide-down">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Term (Months)</label>
                    <select id="sim-term" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900">
                         <option value="3">3 Months</option>
                         <option value="6">6 Months</option>
                         <option value="12">12 Months</option>
                         <option value="24">24 Months</option>
                    </select>
                </div>

                <!-- New Feature: Urgency -->
                <div>
                     <label class="block text-[10px] font-bold text-slate-500 uppercase mb-2">Urgency</label>
                     <div class="flex gap-2">
                        <button type="button" class="btn-sim-urgency flex-1 py-2 rounded-xl text-xs font-bold border transition-colors bg-rose-100 text-rose-600 border-rose-200" data-value="now">Buy Now</button>
                        <button type="button" class="btn-sim-urgency flex-1 py-2 rounded-xl text-xs font-bold border transition-colors bg-white text-slate-500 border-slate-200" data-value="wait">Can Wait</button>
                     </div>
                </div>

                <button id="btn-run-sim" class="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors">Run Pilot Check</button>
            </div>
            <div class="bg-slate-50 p-6 rounded-2xl border-dashed border-2 border-slate-200 flex flex-col justify-center items-center" id="sim-result">
                <i data-lucide="brain" class="w-10 h-10 mb-2 opacity-20 text-slate-400"></i>
                <p class="text-sm italic text-slate-400">Define a purchase to see the impact.</p>
            </div>
        </div>
    </div>`;
};

// Added missing renderBudgets function to prevent errors
const renderBudgets = () => {
    // Calculate totals
    // @ts-ignore
    const totalBudget = Object.values(state.categoryBudgets).reduce((a, b) => a + (b as number), 0);
    const totalSpent = state.transactions.filter(t => t.category !== 'income').reduce((a, t) => a + t.amount, 0);
    const totalRemaining = Math.max(0, totalBudget - totalSpent);
    const totalPct = Math.min((totalSpent / totalBudget) * 100, 100);
    
    // Header
    const headerHtml = `
    <div class="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-xl mb-8 animate-slide-in relative overflow-hidden">
        <div class="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
            <div class="flex-1 w-full">
                <p class="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Total Monthly Budget</p>
                <div class="flex items-baseline gap-2 mb-4">
                    <h2 class="text-3xl md:text-4xl font-black">${formatCurrency(totalBudget)}</h2>
                    <span class="text-blue-200 font-medium">/ Month</span>
                </div>
                
                <div class="w-full h-3 bg-black/20 rounded-full overflow-hidden mb-2">
                    <div class="h-full bg-white rounded-full" style="width: ${totalPct}%"></div>
                </div>
                <div class="flex justify-between text-xs font-bold text-blue-100">
                    <span>Spent: ${formatCurrency(totalSpent)}</span>
                    <span>Remaining: ${formatCurrency(totalRemaining)}</span>
                </div>
            </div>

            <div class="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl max-w-sm w-full md:w-auto">
                 <div class="flex items-center gap-2 mb-2">
                    <i data-lucide="info" class="w-4 h-4 text-blue-200"></i>
                    <span class="text-xs font-bold uppercase text-blue-200">Insights</span>
                 </div>
                 <p class="text-sm leading-relaxed">You have used <strong>${Math.round(totalPct)}%</strong> of your total budget. ${totalPct > 80 ? 'You are nearing your limit.' : 'You are on track.'}</p>
            </div>
        </div>
    </div>`;

    // Category Cards
    const catsHtml = state.categories.filter(c => c.id !== 'income').map(cat => {
        // @ts-ignore
        const limit = state.categoryBudgets[cat.id] || 0;
        const spent = state.transactions.filter(t => t.category === cat.id).reduce((a, t) => a + t.amount, 0);
        const remaining = limit - spent;
        const pct = limit > 0 ? (spent / limit) * 100 : 0;
        
        let barColor = 'bg-emerald-500';
        if(pct > 75) barColor = 'bg-amber-500';
        if(pct > 100) barColor = 'bg-rose-500';
        
        return `
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">
                    <div class="p-3 ${cat.bg} ${cat.color} rounded-xl">
                        <i data-lucide="${cat.icon}" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-900">${cat.label}</h3>
                        <p class="text-xs text-slate-500">${Math.round(pct)}% Used</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-[10px] text-slate-400 font-bold uppercase">Limit</p>
                    <p class="font-bold text-slate-900">${formatCurrency(limit)}</p>
                </div>
            </div>
            
            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div class="h-full ${barColor}" style="width: ${Math.min(pct, 100)}%"></div>
            </div>
            
            <div class="flex justify-between text-xs font-bold">
                <span class="${pct > 100 ? 'text-rose-600' : 'text-slate-700'}">${formatCurrency(spent)}</span>
                <span class="text-slate-400">Remaining: ${remaining < 0 ? '-' : ''}${formatCurrency(Math.abs(remaining))}</span>
            </div>
        </div>
        `;
    }).join('');

    return `
    <div class="animate-slide-in">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold flex items-center gap-2 text-slate-900">
                <i data-lucide="banknote" class="text-blue-600"></i> Budget Planner
            </h2>
            <button id="btn-add-category" class="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <i data-lucide="plus-circle" class="w-4 h-4"></i> Add Category
            </button>
        </div>
        
        ${headerHtml}
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${catsHtml}
        </div>
    </div>`;
};

// --- App Logic ---

const app = {
    $container: null as any, 

    init: () => {
        app.$container = $('#main-container');
        app.render();
        app.attachEvents();
        lucide.createIcons();
    },

    switchView: (viewName: string) => {
        if (state.currentView === viewName) return;
        state.currentView = viewName;
        app.render();
        $('.nav-btn').removeClass('bg-slate-100 text-blue-600').addClass('text-slate-600');
        $(`.nav-btn[data-view="${viewName}"]`).addClass('bg-slate-100 text-blue-600').removeClass('text-slate-600');
    },

    render: () => {
        requestAnimationFrame(() => {
            $('#slide-menu').addClass('hidden');
            let html = '';
            switch (state.currentView) {
                case 'dashboard': html = renderDashboard(); break;
                case 'wallets': html = renderWallets(); break;
                case 'reports': html = renderReports(); break;
                case 'goals': html = renderGoals(); break;
                case 'history': html = renderHistory(); break;
                case 'settings': html = renderSettings(); break;
                case 'simulation': html = renderSimulation(); break;
                case 'budgets': html = renderBudgets(); break;
                default: html = renderDashboard();
            }
            app.$container.html(html);
            lucide.createIcons({ root: app.$container[0] });
        });
    },

    attachEvents: () => {
        // Theme toggle logic removed

        $('#btn-menu').off('click').on('click', () => $('#slide-menu').removeClass('hidden'));
        $('#btn-close-menu, #slide-menu-backdrop').off('click').on('click', () => $('#slide-menu').addClass('hidden'));
        $(document).off('click', '.nav-btn').on('click', '.nav-btn', function(this: HTMLElement) {
            const view = $(this).data('view');
            app.switchView(view);
        });

        $('#fab-chat').off('click').on('click', () => $('#modal-chat').removeClass('hidden').addClass('flex'));
        $('.btn-close-modal').off('click').on('click', () => {
            $('.fixed.z-\\[80\\]').addClass('hidden').removeClass('flex');
            $('.fixed.z-\\[90\\]').addClass('hidden').removeClass('flex');
            $('.fixed.z-\\[95\\]').addClass('hidden').removeClass('flex'); 
        });
        
        // --- View All Handlers (Corrected) ---
        $(document).off('click', '#btn-view-goals').on('click', '#btn-view-goals', () => {
            app.switchView('goals');
        });
        
        $(document).off('click', '#btn-view-transactions').on('click', '#btn-view-transactions', () => {
            app.switchView('history');
        });

        // --- Recommendation Logic ---
        $(document).off('click', '#btn-see-all-recs').on('click', '#btn-see-all-recs', () => {
            const $list = $('#recommendations-list').empty();
            
            // Top Critical (First 3)
            $list.append(`<h4 class="font-bold text-sm text-slate-500 uppercase tracking-widest mb-3 mt-1">Critical Insights</h4>`);
            state.recommendations.slice(0, 3).forEach(rec => {
                $list.append(`
                     <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 flex gap-4 items-start relative group">
                        <button class="absolute top-3 right-3 p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-full btn-dismiss-rec transition-all" title="Dismiss">
                            <i data-lucide="check" class="w-5 h-5"></i>
                        </button>
                        <div class="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shrink-0"><i data-lucide="${rec.icon}"></i></div>
                        <div class="pr-8">
                            <h4 class="font-bold text-sm text-slate-900 mb-1">${rec.title}</h4>
                            <p class="text-xs text-slate-600 leading-relaxed">${rec.desc}</p>
                        </div>
                     </div>
                `);
            });

            // Others
            $list.append(`<h4 class="font-bold text-sm text-slate-500 uppercase tracking-widest mb-3 mt-6">More Opportunities</h4>`);
            state.recommendations.slice(3).forEach(rec => {
                $list.append(`
                     <div class="bg-white rounded-xl p-4 border border-slate-100 flex gap-4 items-start relative group">
                        <button class="absolute top-3 right-3 p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-full btn-dismiss-rec transition-all" title="Dismiss">
                            <i data-lucide="check" class="w-5 h-5"></i>
                        </button>
                        <div class="p-2.5 bg-slate-100 text-slate-500 rounded-xl shrink-0"><i data-lucide="${rec.icon}"></i></div>
                        <div class="pr-8">
                            <h4 class="font-bold text-sm text-slate-900 mb-1">${rec.title}</h4>
                            <p class="text-xs text-slate-600 leading-relaxed">${rec.desc}</p>
                        </div>
                     </div>
                `);
            });
            
            lucide.createIcons({ root: $list[0] });
            $('#modal-recommendations').removeClass('hidden').addClass('flex');
        });

        // Click Recommendation to Chat (Only for Dashboard cards)
        $(document).off('click', '.recommendation-card').on('click', '.recommendation-card', function(this: HTMLElement) {
            const title = $(this).data('title');
            const desc = $(this).data('desc');
            
            $('#modal-recommendations').addClass('hidden').removeClass('flex'); // Close recs modal if open
            $('#modal-chat').removeClass('hidden').addClass('flex');
            
            // Auto submit query with context
            const query = `Explain the recommendation: "${title}". Context: "${desc}"`;
            $('#chat-input').val(query);
            $('#form-chat').submit();
        });

        // Dismiss Recommendation
        $(document).off('click', '.btn-dismiss-rec').on('click', '.btn-dismiss-rec', function(this: HTMLElement) {
            const card = $(this).closest('div'); 
            card.addClass('opacity-50 pointer-events-none'); // Visual dismissal
        });

        // --- Add Transaction Modal Logic ---
        $('#fab-add').off('click').on('click', () => {
            state.entryType = 'expense';
            updateModalState();
            const $catSelect = $('#inp-category').empty();
            state.categories.forEach(c => $catSelect.append(`<option value="${c.id}">${c.label}</option>`));
            const $cardSelect = $('#inp-card').empty();
            state.cards.forEach(c => $cardSelect.append(`<option value="${c.id}">${c.name}</option>`));
            const now = new Date();
            $('#inp-date').val(now.toISOString().split('T')[0]);
            $('#inp-time').val(now.toTimeString().split(' ')[0].substring(0,5));
            $('#modal-add').removeClass('hidden').addClass('flex');
        });

        const updateModalState = () => {
             const isExpense = state.entryType === 'expense';
             if(isExpense) {
                 $('#tab-expense').addClass('bg-white shadow-sm text-slate-800').removeClass('text-slate-500 hover:text-slate-700');
                 $('#tab-income').removeClass('bg-white shadow-sm text-slate-800').addClass('text-slate-500 hover:text-slate-700');
                 $('#section-scanner').removeClass('hidden');
                 $('#section-payment-type').removeClass('hidden');
                 $('#lbl-merchant').text('Merchant');
                 $('#lbl-card').text('Strategic Card Choice');
                 $('#btn-submit-entry').text('Save Expense').removeClass('bg-emerald-600 hover:bg-emerald-700').addClass('bg-blue-600 hover:bg-blue-700');
                 $('.btn-payment-type[data-type="straight"]').click(); 
             } else {
                 $('#tab-income').addClass('bg-white shadow-sm text-slate-800').removeClass('text-slate-500 hover:text-slate-700');
                 $('#tab-expense').removeClass('bg-white shadow-sm text-slate-800').addClass('text-slate-500 hover:text-slate-700');
                 $('#section-scanner').addClass('hidden');
                 $('#section-payment-type').addClass('hidden');
                 $('#installment-config').addClass('hidden'); 
                 $('#lbl-merchant').text('Source');
                 $('#lbl-card').text('Deposit To');
                 $('#btn-submit-entry').text('Save Income').removeClass('bg-blue-600 hover:bg-blue-700').addClass('bg-emerald-600 hover:bg-emerald-700');
             }
        };

        $('#tab-expense').off('click').on('click', (e: any) => { e.preventDefault(); state.entryType = 'expense'; updateModalState(); });
        $('#tab-income').off('click').on('click', (e: any) => { e.preventDefault(); state.entryType = 'income'; updateModalState(); });

        // History Filters
        $(document).off('click', '.btn-history-filter').on('click', '.btn-history-filter', function(this: HTMLElement) {
             state.historyView.mode = $(this).data('mode');
             app.render();
        });
        $(document).off('click', '.btn-history-type').on('click', '.btn-history-type', function(this: HTMLElement) {
             state.historyView.filter = $(this).data('type');
             app.render();
        });
        
        const updateHistoryDate = (delta: number) => {
            const { mode, date } = state.historyView;
            const newDate = new Date(date);
            if(mode === 'daily') newDate.setDate(date.getDate() + delta);
            else if(mode === 'monthly') newDate.setMonth(date.getMonth() + delta);
            else newDate.setFullYear(date.getFullYear() + delta);
            state.historyView.date = newDate;
            app.render();
        };
        $(document).off('click', '#btn-history-prev').on('click', '#btn-history-prev', () => updateHistoryDate(-1));
        $(document).off('click', '#btn-history-next').on('click', '#btn-history-next', () => updateHistoryDate(1));

        // Report Filters
        const updateReportDate = (delta: number) => {
            const newDate = new Date(state.reportDate);
            newDate.setMonth(state.reportDate.getMonth() + delta);
            state.reportDate = newDate;
            app.render();
        };
        $(document).off('click', '#btn-report-prev').on('click', '#btn-report-prev', () => updateReportDate(-1));
        $(document).off('click', '#btn-report-next').on('click', '#btn-report-next', () => updateReportDate(1));

        // Edit Transaction Logic
        $(document).off('click', '.btn-edit-tx').on('click', '.btn-edit-tx', function(this: HTMLElement) {
            const id = $(this).data('id');
            const tx = state.transactions.find(t => t.id === id);
            if(!tx) return;

            // Populate Modal
            $('#edit-tx-id').val(tx.id);
            $('#edit-tx-amount').val(tx.amount);
            $('#edit-tx-date').val(tx.date);
            $('#edit-tx-merchant').val(tx.merchant);
            
            // Populate Categories
            const $catSelect = $('#edit-tx-category').empty();
            state.categories.forEach(c => {
                const selected = c.id === tx.category ? 'selected' : '';
                $catSelect.append(`<option value="${c.id}" ${selected}>${c.label}</option>`);
            });

            $('#modal-edit-transaction').removeClass('hidden').addClass('flex');
        });

        $('#form-edit-transaction').off('submit').on('submit', (e: any) => {
            e.preventDefault();
            const id = parseInt($('#edit-tx-id').val());
            const amount = parseFloat($('#edit-tx-amount').val());
            const date = $('#edit-tx-date').val();
            const merchant = $('#edit-tx-merchant').val();
            const category = $('#edit-tx-category').val();

            const idx = state.transactions.findIndex(t => t.id === id);
            if(idx > -1) {
                state.transactions[idx] = { ...state.transactions[idx], amount, date, merchant, category };
            }
            $('#modal-edit-transaction').addClass('hidden').removeClass('flex');
            app.render();
        });

        // Delete Transaction Logic
        $(document).off('click', '#btn-delete-tx').on('click', '#btn-delete-tx', function() {
            const id = parseInt($('#edit-tx-id').val());
            const idx = state.transactions.findIndex(t => t.id === id);
            if(idx > -1) {
                if(confirm("Are you sure you want to delete this transaction?")) {
                    state.transactions.splice(idx, 1);
                    $('#modal-edit-transaction').addClass('hidden').removeClass('flex');
                    app.render();
                }
            }
        });

        // Settings Logic
        $(document).off('change', '.inp-budget-setting').on('change', '.inp-budget-setting', function(this: HTMLInputElement) {
            const cat = $(this).data('cat');
            const val = parseFloat($(this).val()) || 0;
            // @ts-ignore
            state.categoryBudgets[cat] = val;
            app.render(); 
        });

        $(document).off('change', '#setting-currency').on('change', '#setting-currency', function(this: HTMLSelectElement) {
            state.currency = $(this).val();
            app.render();
        });

        $(document).off('change', '#setting-country').on('change', '#setting-country', function(this: HTMLSelectElement) {
            state.country = $(this).val();
        });

        // --- Magic Scanner in Chat ---
        $('#btn-chat-upload').off('click').on('click', () => $('#chat-file-upload').click());
        
        $('#chat-file-upload').off('change').on('change', async function(e: any) {
             const file = e.target.files[0];
             if(!file) return;

             const $chatBox = $('#chat-messages');
             const base64 = await fileToBase64(file);
             $chatBox.append(`
                <div class="flex flex-col items-end">
                    <div class="max-w-[85%] p-2 rounded-2xl shadow-sm bg-blue-600 text-white rounded-tr-none overflow-hidden">
                        <img src="${base64}" class="max-w-full h-auto rounded-lg mb-1" />
                        <p class="text-xs">Analyze this image</p>
                    </div>
                </div>
             `);
             $chatBox.scrollTop($chatBox[0].scrollHeight);
             
             const $loading = $(`<div class="text-xs text-slate-400 italic px-2 animate-pulse" id="msg-loading">Wais is analyzing receipt...</div>`).appendTo($chatBox);

             try {
                const prompt = `Analyze this image. Determine if it is a receipt or financial document. 
                If yes, extract:
                - Type (Income or Expense)
                - Amount (number)
                - Merchant
                - Category (guess one)
                - Date (YYYY-MM-DD)
                - Time
                - Installment details if any
                - Brief Notes
                
                Return JSON structure:
                {
                    "is_receipt": boolean,
                    "data": {
                        "type": "income" | "expense",
                        "amount": number,
                        "merchant": string,
                        "category": string,
                        "date": string,
                        "time": string,
                        "installment": string | null,
                        "notes": string
                    },
                    "message": string // Analysis summary text
                }
                `;

                const response = await ai.models.generateContent({
                  model: "gemini-3-flash-preview",
                  contents: [
                    {
                      role: "user",
                      parts: [
                        { text: prompt },
                        { inlineData: { mimeType: "image/jpeg", data: base64.split('base64,')[1] } },
                      ],
                    },
                  ],
                  config: { responseMimeType: 'application/json' }
                });

                $('#msg-loading').remove();
                const result = JSON.parse(response.text);

                if (!result.is_receipt) {
                     $chatBox.append(`
                        <div class="flex flex-col items-start">
                            <div class="max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm bg-white border border-slate-100 text-slate-700 rounded-tl-none">
                                I couldn't detect a valid receipt or financial document in that image. Please try again.
                            </div>
                        </div>
                    `);
                } else {
                    const d = result.data;
                    const html = `
                    <div class="flex flex-col items-start w-full">
                        <div class="max-w-[90%] w-full p-4 rounded-2xl shadow-sm bg-white border border-slate-100 text-slate-700 rounded-tl-none">
                            <p class="mb-3 text-sm">${result.message || "Here's what I found:"}</p>
                            
                            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm space-y-2 mb-3">
                                <div class="flex justify-between border-b border-slate-200 pb-2 mb-2">
                                    <span class="font-bold uppercase text-[10px] text-slate-500">Total</span>
                                    <span class="font-black text-lg ${d.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}">${formatCurrency(d.amount)}</span>
                                </div>
                                <div class="grid grid-cols-2 gap-2 text-xs">
                                    <div><span class="text-slate-400">Merchant</span><p class="font-bold">${d.merchant}</p></div>
                                    <div><span class="text-slate-400">Date</span><p class="font-bold">${d.date}</p></div>
                                    <div><span class="text-slate-400">Category</span><p class="font-bold capitalize">${d.category}</p></div>
                                    <div><span class="text-slate-400">Type</span><p class="font-bold capitalize">${d.type}</p></div>
                                </div>
                                ${d.installment ? `<div class="text-xs bg-blue-50 text-blue-600 p-2 rounded-lg mt-2"><strong>Installment:</strong> ${d.installment}</div>` : ''}
                                ${d.notes ? `<div class="text-xs italic text-slate-500 mt-2">"${d.notes}"</div>` : ''}
                            </div>

                            <div>
                                <button class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors btn-confirm-scan shadow-md">Confirm & Save</button>
                            </div>
                        </div>
                    </div>`;
                    $chatBox.append(html);
                }
                
                $chatBox.scrollTop($chatBox[0].scrollHeight);
             } catch(err) {
                 $('#msg-loading').remove();
                 $chatBox.append(`<div class="text-xs text-red-500 px-4">Analysis failed. Please try again.</div>`);
             }
             $(this).val('');
        });

        // Handle Confirm Scan Click (Mock functionality)
        $(document).off('click', '.btn-confirm-scan').on('click', '.btn-confirm-scan', function(this: HTMLElement) {
             const $btn = $(this);
             $btn.text('Saved!').removeClass('bg-blue-600 hover:bg-blue-700').addClass('bg-emerald-500 cursor-default');
             setTimeout(() => {
                 // In a real app, this would actually add to state.transactions
                 // For now, visual feedback only as requested "ask the user to confirm"
             }, 500);
        });

        // Main Chat
        $(document).off('submit', '#form-chat, .form-main-chat').on('submit', '#form-chat, .form-main-chat', async function(e: any) {
            e.preventDefault();
            const $input = $(this).find('input[type="text"]');
            const msg = $input.val().trim();
            if(!msg) return;

            if($(this).hasClass('form-main-chat')) $('#modal-chat').removeClass('hidden').addClass('flex');

            const $chatBox = $('#chat-messages');
            $chatBox.append(`
                <div class="flex flex-col items-end">
                    <div class="max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm bg-blue-600 text-white rounded-tr-none">${msg}</div>
                </div>
            `);
            $input.val('');
            $chatBox.scrollTop($chatBox[0].scrollHeight);

            const $loading = $(`<div class="text-xs text-slate-400 italic px-2 animate-pulse" id="msg-loading">Wais is analyzing...</div>`).appendTo($chatBox);
            const context = {
                currentDate: state.currentDate.toISOString().split('T')[0],
                cards: state.cards,
                remainingBudget: 50000,
                categoryBudgets: state.categoryBudgets,
                totalCash: 3200
            };
            try {
                const response = await chatWithPilot(msg, context);
                $('#msg-loading').remove();
                $chatBox.append(`
                    <div class="flex flex-col items-start">
                        <div class="max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm bg-white border border-slate-100 text-slate-700 rounded-tl-none">${response}</div>
                    </div>
                `);
                $chatBox.scrollTop($chatBox[0].scrollHeight);
            } catch(e) {
                 $('#msg-loading').text('Error analyzing.');
            }
        });

        $('.btn-payment-type').off('click').on('click', function(this: HTMLElement) {
            const type = $(this).data('type');
            $('.btn-payment-type').removeClass('bg-blue-600 text-white border-blue-600').addClass('bg-white text-slate-500 border-slate-200');
            $(this).removeClass('bg-white text-slate-500 border-slate-200').addClass('bg-blue-600 text-white border-blue-600');
            
            if(type === 'installment') $('#installment-config').removeClass('hidden');
            else $('#installment-config').addClass('hidden');
        });

        // --- Edit Wallet Logic ---
        $(document).off('click', '.btn-edit-wallet').on('click', '.btn-edit-wallet', function(this: HTMLElement) {
            const cardId = $(this).data('id');
            const card = state.cards.find(c => c.id == cardId);
            if (!card) return;

            // Populate Modal
            $('#edit-wallet-id').val(card.id);
            $('#edit-name').val(card.name);
            $('#edit-provider').val(card.provider);
            $('#edit-type').val(card.type);
            $('#edit-balance').val(card.balance);
            $('#edit-limit').val(card.limit || '');
            
            $('#edit-due-date').val(card.dueDate || '');
            $('#edit-cycle-date').val(card.cycleDate || '');
            $('#edit-cap').val(card.cashbackCap || '');

            // Render Multipliers
            const $multipliers = $('#edit-multipliers').empty();
            const validCats = state.categories.filter(c => c.id !== 'income');
            
            validCats.forEach(cat => {
                const existingVal = (card.benefits[cat.id] || 0) * 100; // Convert 0.04 to 4
                $multipliers.append(`
                    <div class="flex items-center justify-between py-1">
                        <div class="flex items-center gap-2">
                            <i data-lucide="${cat.icon}" class="w-4 h-4 text-slate-400"></i>
                            <span class="text-sm font-medium">${cat.label}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <input type="number" step="0.01" class="w-16 p-1.5 rounded-lg border border-slate-200 bg-white text-right text-sm inp-multiplier outline-none text-slate-900" data-cat="${cat.id}" value="${existingVal}">
                            <span class="text-xs text-slate-400">%</span>
                        </div>
                    </div>
                `);
            });
            
            lucide.createIcons({ root: $multipliers[0] });

            $('#modal-edit-wallet h3').text('Edit Wallet'); // Ensure title is reset
            $('#modal-edit-wallet').removeClass('hidden').addClass('flex');
        });

        // Add Wallet Logic
        $(document).off('click', '#btn-add-wallet').on('click', '#btn-add-wallet', () => {
             $('#edit-wallet-id').val('');
             $('#edit-name').val('');
             $('#edit-provider').val('');
             $('#edit-type').val('credit');
             $('#edit-balance').val('');
             $('#edit-limit').val('');
             $('#edit-due-date').val('');
             $('#edit-cycle-date').val('');
             $('#edit-cap').val('');
             
             // Render empty multipliers
             const $multipliers = $('#edit-multipliers').empty();
             const validCats = state.categories.filter(c => c.id !== 'income');
             validCats.forEach(cat => {
                $multipliers.append(`
                    <div class="flex items-center justify-between py-1">
                        <div class="flex items-center gap-2">
                            <i data-lucide="${cat.icon}" class="w-4 h-4 text-slate-400"></i>
                            <span class="text-sm font-medium">${cat.label}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <input type="number" step="0.01" class="w-16 p-1.5 rounded-lg border border-slate-200 bg-white text-right text-sm inp-multiplier outline-none text-slate-900" data-cat="${cat.id}" value="0">
                            <span class="text-xs text-slate-400">%</span>
                        </div>
                    </div>
                `);
             });
             lucide.createIcons({ root: $multipliers[0] });

             $('#modal-edit-wallet h3').text('Add New Wallet');
             $('#modal-edit-wallet').removeClass('hidden').addClass('flex');
        });

        // Save Wallet (Add/Edit)
        $('#form-edit-wallet').off('submit').on('submit', function(e: any) {
            e.preventDefault();
            const idStr = $('#edit-wallet-id').val();
            let cardIndex = -1;
            let id = 0;

            if (idStr) {
                id = parseInt(idStr);
                cardIndex = state.cards.findIndex(c => c.id === id);
            } else {
                // New ID
                id = Math.max(...state.cards.map(c => c.id)) + 1;
            }

            const benefits: Record<string, number> = {};
            $('.inp-multiplier').each(function(this: HTMLInputElement) {
                const val = parseFloat($(this).val()) || 0;
                const cat = $(this).data('cat');
                if (val > 0) benefits[cat] = val / 100;
            });
            benefits['default'] = 0.003; 
            
            const newCardData: any = {
                id: id,
                name: $('#edit-name').val(),
                provider: $('#edit-provider').val(),
                type: $('#edit-type').val(),
                balance: parseFloat($('#edit-balance').val()) || 0,
                limit: parseFloat($('#edit-limit').val()) || null,
                dueDate: $('#edit-due-date').val() || null,
                cycleDate: $('#edit-cycle-date').val() || null,
                cashbackCap: parseFloat($('#edit-cap').val()) || null,
                benefits: benefits,
                cashbackYTD: 0,
                color: 'bg-slate-700', // Default color for now
                icon: 'credit-card'
            };

            if (cardIndex > -1) {
                state.cards[cardIndex] = { ...state.cards[cardIndex], ...newCardData, cashbackYTD: state.cards[cardIndex].cashbackYTD, color: state.cards[cardIndex].color, icon: state.cards[cardIndex].icon };
            } else {
                state.cards.push(newCardData);
            }

            $('#modal-edit-wallet').addClass('hidden').removeClass('flex');
            app.render(); 
        });

        // --- Goals Logic ---
        $(document).off('click', '#btn-add-goal').on('click', '#btn-add-goal', () => {
             $('#goal-id').val('');
             $('#goal-name').val('');
             $('#goal-target').val('');
             $('#goal-current').val('');
             $('#goal-color').val('bg-emerald-500');
             
             // Populate Source
             const $source = $('#goal-source').empty().append('<option value="">None</option>');
             state.cards.filter(c => c.type === 'debit' || c.type === 'cash').forEach(c => {
                 $source.append(`<option value="${c.id}">${c.name}</option>`);
             });

             $('#modal-goal-title').text('Add Goal');
             $('#modal-goal').removeClass('hidden').addClass('flex');
        });

        $(document).off('click', '.btn-edit-goal').on('click', '.btn-edit-goal', function(this: HTMLElement) {
             const id = $(this).data('id');
             const goal = state.goals.find(g => g.id === id);
             if(!goal) return;
             $('#goal-id').val(goal.id);
             $('#goal-name').val(goal.name);
             $('#goal-target').val(goal.target);
             $('#goal-current').val(goal.current);
             $('#goal-color').val(goal.color);
             
             // Populate Source and Select
             const $source = $('#goal-source').empty().append('<option value="">None</option>');
             state.cards.filter(c => c.type === 'debit' || c.type === 'cash').forEach(c => {
                 const selected = c.id === goal.sourceId ? 'selected' : '';
                 $source.append(`<option value="${c.id}" ${selected}>${c.name}</option>`);
             });

             $('#modal-goal-title').text('Edit Goal');
             $('#modal-goal').removeClass('hidden').addClass('flex');
        });

        $('#form-goal').off('submit').on('submit', (e: any) => {
             e.preventDefault();
             const idVal = $('#goal-id').val();
             const name = $('#goal-name').val();
             const target = parseFloat($('#goal-target').val());
             const current = parseFloat($('#goal-current').val());
             const color = $('#goal-color').val();
             const sourceId = parseInt($('#goal-source').val()) || undefined;
             
             let icon = 'target';
             if(color.includes('purple')) icon = 'plane';
             if(color.includes('blue')) icon = 'laptop';
             if(color.includes('rose')) icon = 'alert-circle';
             if(color.includes('emerald')) icon = 'shield';

             if(idVal) {
                 const idx = state.goals.findIndex(g => g.id === parseInt(idVal));
                 if(idx > -1) state.goals[idx] = { id: parseInt(idVal), name, target, current, color, icon, sourceId };
             } else {
                 const newId = Math.max(...state.goals.map(g => g.id)) + 1;
                 state.goals.push({ id: newId, name, target, current, color, icon, sourceId });
             }
             $('#modal-goal').addClass('hidden').removeClass('flex');
             app.render();
        });
        
        // --- Wallet Transactions Logic ---
        $(document).off('click', '.btn-view-wallet-tx').on('click', '.btn-view-wallet-tx', function(this: HTMLElement) {
            const cardId = $(this).data('id');
            const card = state.cards.find(c => c.id === cardId);
            if(!card) return;

            $('#wallet-tx-title').text(`${card.name} Transactions`);
            const $list = $('#wallet-tx-list').empty();
            const txs = state.transactions.filter(t => t.cardId === cardId);

            if(txs.length === 0) {
                $list.html(`<div class="p-8 text-center text-slate-400 italic">No transactions found.</div>`);
            } else {
                txs.forEach(t => {
                    $list.append(`
                        <div class="flex justify-between items-center p-4 border-b border-slate-100 last:border-0">
                            <div>
                                <p class="font-bold text-slate-900">${t.merchant}</p>
                                <p class="text-xs text-slate-500">${t.date} • ${t.category}</p>
                            </div>
                            <span class="font-bold text-slate-900">${formatCurrency(t.amount)}</span>
                        </div>
                    `);
                });
            }
            $('#modal-wallet-transactions').removeClass('hidden').addClass('flex');
        });

        // --- Simulation Logic Updates ---
        $(document).off('click', '.btn-sim-payment').on('click', '.btn-sim-payment', function(this: HTMLElement) {
            const type = $(this).data('type');
            $('.btn-sim-payment').removeClass('bg-blue-600 text-white border-blue-600').addClass('bg-white text-slate-500 border-slate-200');
            $(this).removeClass('bg-white text-slate-500 border-slate-200').addClass('bg-blue-600 text-white border-blue-600');
            
            if(type === 'installment') $('#sim-term-wrapper').removeClass('hidden');
            else $('#sim-term-wrapper').addClass('hidden');
        });

        $(document).off('click', '.btn-sim-urgency').on('click', '.btn-sim-urgency', function(this: HTMLElement) {
            $('.btn-sim-urgency').removeClass('bg-rose-100 text-rose-600 border-rose-200').addClass('bg-white text-slate-500 border-slate-200');
            $(this).removeClass('bg-white text-slate-500 border-slate-200').addClass('bg-rose-100 text-rose-600 border-rose-200');
        });

        // Simulation Run
        $(document).on('click', '#btn-run-sim', () => {
            const amount = parseFloat(($('#sim-amount').val() as string));
            const cardId = $('#sim-card').val();
            const card = state.cards.find(c => c.id == cardId);
            const categoryText = $("#sim-cat option:selected").text();
            
            if(!amount || !card) return;
            
            const paymentType = $('.btn-sim-payment.bg-blue-600').data('type') || 'straight';
            const term = paymentType === 'installment' ? parseInt($('#sim-term').val()) : 1;
            const monthly = amount / term;

            const resultHtml = `
            <div class="h-full flex flex-col justify-start">
                <h3 class="font-bold text-slate-900 mb-4">Pilot's Projection</h3>
                <p class="text-sm text-slate-600 mb-6">Analysis for ${formatCurrency(amount)} (${categoryText}):</p>
                
                <div class="space-y-4">
                    <div class="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-sm border border-emerald-100">
                        <p class="font-bold mb-1">✅ Cash Flow: Paying ${formatCurrency(monthly)}/mo for ${term} months.</p>
                        <p class="text-xs opacity-80">Preserves ${formatCurrency(100000)} liquidity today.</p>
                    </div>

                    <div class="p-3 bg-slate-50 text-slate-700 rounded-xl text-sm border border-slate-100 flex gap-2 items-start">
                         <i data-lucide="credit-card" class="w-4 h-4 mt-0.5 text-slate-400"></i>
                         <div>
                            <span class="font-bold">Card Status:</span> ${card.cycleDate ? 'Cycle Ending Soon. Due soon.' : 'Normal status.'}
                         </div>
                    </div>

                    ${amount > 5000 ? `
                    <div class="p-3 bg-amber-50 text-amber-800 rounded-xl text-sm border border-amber-100 flex gap-2 items-start">
                         <i data-lucide="alert-triangle" class="w-4 h-4 mt-0.5 text-amber-500"></i>
                         <div>
                            <span class="font-bold">Warning:</span> Exceeds remaining monthly safe-to-spend (${formatCurrency(7249)}).
                         </div>
                    </div>
                    ` : ''}
                </div>
            </div>`;
            $('#sim-result').html(resultHtml);
            lucide.createIcons({ root: document.getElementById('sim-result') });
        });
        
        // Receipt Scan (Mock Trigger for now, logic exists in service)
        $('#btn-scan').off('click').on('click', () => $('#file-upload').click());
        $('#file-upload').off('change').on('change', async (e: any) => {
             const file = e.target.files[0];
             if(!file) return;
             $('#btn-scan').text('PILOTING...');
             try {
                 const base64 = await fileToBase64(file);
                 const data = await scanReceipt(base64);
                 $('#inp-merchant').val(data.merchant);
                 $('#inp-amount').val(data.amount);
                 const catMatch = state.categories.find(c => c.id === data.category?.toLowerCase());
                 if(catMatch) $('#inp-category').val(catMatch.id);
                 
                 // Populate note field with summary
                 if(data.note) {
                     $('#inp-note').val(data.note);
                 }
                 
             } catch(err) {
                 alert('Scan failed');
             } finally {
                 $('#btn-scan').text('SCAN NOW');
             }
        });

        // --- Add Budget Category Logic ---
        // Ensure delegation is robust by attaching to document body
        $(document).off('click', '#btn-add-category').on('click', '#btn-add-category', () => {
             $('#new-cat-name').val('');
             $('#new-cat-limit').val('');
             $('#new-cat-color').val('blue');
             $('#modal-add-category').removeClass('hidden').addClass('flex');
        });

        $('#form-add-category').off('submit').on('submit', function(e: any) {
            e.preventDefault();
            const name = $('#new-cat-name').val();
            const limit = parseFloat($('#new-cat-limit').val());
            const colorName = $('#new-cat-color').val();
            
            if(!name || isNaN(limit)) return;

            const id = name.toLowerCase().replace(/ /g, '-');
            const colorMap: any = {
                blue: { color: 'text-blue-600', bg: 'bg-blue-100', fill: 'fill-blue-500' },
                green: { color: 'text-green-600', bg: 'bg-green-100', fill: 'fill-green-500' },
                purple: { color: 'text-purple-600', bg: 'bg-purple-100', fill: 'fill-purple-500' },
                orange: { color: 'text-orange-600', bg: 'bg-orange-100', fill: 'fill-orange-500' },
                pink: { color: 'text-pink-600', bg: 'bg-pink-100', fill: 'fill-pink-500' },
                teal: { color: 'text-teal-600', bg: 'bg-teal-100', fill: 'fill-teal-500' },
                indigo: { color: 'text-indigo-600', bg: 'bg-indigo-100', fill: 'fill-indigo-500' },
                rose: { color: 'text-rose-600', bg: 'bg-rose-100', fill: 'fill-rose-500' }
            };
            const theme = colorMap[colorName] || colorMap.blue;

            // Add to state
            state.categories.push({
                id,
                label: name,
                color: theme.color,
                bg: theme.bg,
                fill: theme.fill,
                icon: 'circle' // Default icon
            });
            // @ts-ignore
            state.categoryBudgets[id] = limit;

            $('#modal-add-category').addClass('hidden').removeClass('flex');
            app.render();
        });
    }
};

(window as any).app = app;

$(document).ready(() => {
    app.init();
});