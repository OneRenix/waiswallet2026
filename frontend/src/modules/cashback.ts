import { state } from '../state';
import { formatCurrency } from '../utils';

declare var $: any;

export const renderCashback = () => {
    const currentMonth = state.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Calculate totals
    const totalMTD = state.cards.reduce((sum, card) => sum + (card.cashbackMTD || 0), 0);
    const totalPossible = state.cards.reduce((sum, card) => sum + (card.monthlyLimit || 0), 0);
    const overallPct = totalPossible > 0 ? (totalMTD / totalPossible) * 100 : 0;

    // Recent cashback transactions (current month)
    const currentMonthStr = state.currentDate.toISOString().slice(0, 7);
    const recentCashback = state.transactions
        .filter(t => t.cashback > 0 && t.billingDate && t.billingDate.startsWith(currentMonthStr))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const renderCardBreakdown = (card: any) => {
        const earned = card.cashbackMTD || 0;
        const limit = card.monthlyLimit || 0;
        const pct = limit > 0 ? Math.min((earned / limit) * 100, 100) : 0;
        const isNearCap = pct >= 80 && pct < 100;
        const isCapped = pct >= 100;

        let statusBadge = '';
        if (isCapped) {
            statusBadge = `<span class="bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Capped</span>`;
        } else if (isNearCap) {
            statusBadge = `<span class="bg-amber-100 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Near Cap</span>`;
        }

        return `
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">
                    <div class="p-2.5 text-white rounded-xl shadow-sm" style="background-color: ${card.color}">
                        <i data-lucide="${card.icon}" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-slate-900 leading-tight">${card.name}</h4>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">${card.provider}</p>
                    </div>
                </div>
                ${statusBadge}
            </div>
            
            <div class="mb-4">
                <div class="flex justify-between items-end mb-1.5">
                    <span class="text-2xl font-black text-slate-900">${formatCurrency(earned)}</span>
                    <span class="text-xs font-bold text-slate-400">of ${formatCurrency(limit)} limit</span>
                </div>
                <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full ${isCapped ? 'bg-rose-500' : isNearCap ? 'bg-amber-500' : 'bg-emerald-500'} transition-all duration-1000" style="width: ${pct}%"></div>
                </div>
                <div class="flex justify-between mt-1 text-[10px] font-bold">
                    <span class="${isCapped ? 'text-rose-500' : 'text-slate-400'}">${Math.round(pct)}% Utilization</span>
                    <span class="text-slate-400">${formatCurrency(Math.max(0, limit - earned))} Remaining</span>
                </div>
            </div>

            <div class="pt-4 border-t border-slate-50">
                <p class="text-[10px] font-bold text-slate-400 uppercase mb-2">Reward Rates</p>
                <div class="flex flex-wrap gap-2">
                    ${Object.entries(card.benefits || {}).map(([catId, rate]) => {
            const category = state.categories.find(c => c.id == parseInt(catId));
            if (!category || (rate as number) <= 0) return '';
            return `
                        <span class="px-2 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-100 flex items-center gap-1.5">
                            <i data-lucide="${category.icon}" class="w-3 h-3 text-blue-500"></i>
                            ${category.label}: ${rate}%
                        </span>`;
        }).join('')}
                    ${Object.keys(card.benefits || {}).length === 0 ? '<span class="text-[10px] text-slate-400 italic">No category-specific rewards</span>' : ''}
                </div>
            </div>
        </div>`;
    };

    // Calculate Top Performer
    const topPerformer = [...state.cards].sort((a, b) => (b.cashbackMTD || 0) - (a.cashbackMTD || 0))[0];

    return `
    <div class="animate-slide-in">
        <div class="flex justify-between items-end mb-8">
            <div>
                <h2 class="text-2xl font-bold flex items-center gap-2 text-slate-900 leading-tight">
                    <i data-lucide="coins" class="text-amber-500"></i> Cashback Tracker
                </h2>
                <p class="text-sm text-slate-500 font-medium">Optimizing your rewards for ${currentMonth}</p>
            </div>
            <div class="text-right">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">MTD Total Earned</p>
                <p class="text-3xl font-black text-emerald-600 leading-none tabular-nums">${formatCurrency(totalMTD)}</p>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            ${state.cards.filter(c => c.monthlyLimit && c.monthlyLimit > 0).map(renderCardBreakdown).join('')}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="md:col-span-1 lg:col-span-2">
                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
                    <div class="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 class="font-bold text-slate-800 flex items-center gap-2">
                            <i data-lucide="history" class="w-4 h-4 text-slate-400"></i> Recent Earnings
                        </h3>
                        <span class="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg uppercase tracking-wider">${recentCashback.length} Items this month</span>
                    </div>
                    <div class="divide-y divide-slate-50 overflow-y-auto flex-grow">
                        ${recentCashback.length === 0 ? `
                            <div class="p-12 text-center text-slate-400 italic text-sm">No cashback earnings recorded yet this month.</div>
                        ` : recentCashback.map(t => {
        const card = state.cards.find(c => c.id == t.cardId);
        return `
                            <div class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div class="flex items-center gap-4">
                                    <div class="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                                        <i data-lucide="sparkles" class="w-4 h-4"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm font-bold text-slate-900 mb-0.5">${t.merchant}</p>
                                        <p class="text-[10px] text-slate-500 font-medium">${t.date} • ${card ? card.name : 'Unknown Card'}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm font-black text-emerald-600 tabular-nums">+${formatCurrency(t.cashback)}</p>
                                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">from ${formatCurrency(t.amount)} spend</p>
                                </div>
                            </div>`;
    }).join('')}
                    </div>
                </div>
            </div>

            <div class="md:col-span-1 lg:col-span-1 space-y-6">
                <div class="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-2xl text-white shadow-xl shadow-orange-200/50 overflow-hidden relative group">
                    <div class="relative z-10">
                        <div class="flex items-center gap-2 mb-4">
                            <div class="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <i data-lucide="lightbulb" class="w-5 h-5 text-amber-100"></i>
                            </div>
                            <h3 class="font-bold text-lg">Wais Tip</h3>
                        </div>
                        <p class="text-xs leading-relaxed text-white/90 mb-6 font-medium">
                            You've hit <span class="font-black text-white underline underline-offset-4 decoration-white/30">${Math.round(overallPct)}%</span> of your combined monthly cashback limit. If any card reaches 100%, I'll automatically adjust your "Strategic Choice" to the next best card.
                        </p>
                        <button class="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-md active:scale-95" onclick="window.app.switchView('recommendations')">
                            Review Strategies
                        </button>
                    </div>
                    <i data-lucide="coins" class="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 -rotate-12 group-hover:scale-110 transition-transform duration-700"></i>
                </div>

                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 class="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <i data-lucide="trending-up" class="w-4 h-4 text-emerald-500"></i> Performance Summary
                    </h3>
                    <div class="space-y-5">
                        <div class="flex justify-between items-center">
                            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg. Reward Rate</span>
                            <span class="text-base font-black text-slate-900 tabular-nums">4.2%</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Yearly Projection</span>
                            <span class="text-base font-black text-emerald-600 tabular-nums">${formatCurrency(totalMTD * 12)}</span>
                        </div>
                        <div class="pt-5 mt-5 border-t border-slate-100">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Top Performer</p>
                            ${topPerformer && topPerformer.cashbackMTD > 0 ? `
                            <div class="flex items-center justify-between p-3 rounded-xl border" style="background-color: ${topPerformer.color}10; border-color: ${topPerformer.color}30">
                                <div class="flex items-center gap-3">
                                    <div class="w-2.5 h-2.5 rounded-full animate-pulse" style="background-color: ${topPerformer.color}"></div>
                                    <span class="text-xs font-bold" style="color: ${topPerformer.color}">${topPerformer.name}</span>
                                </div>
                                <span class="text-xs font-black tabular-nums" style="color: ${topPerformer.color}">${formatCurrency(topPerformer.cashbackMTD)}</span>
                            </div>
                            ` : `<p class="text-xs text-slate-400 italic">No earnings records yet.</p>`}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
};

export const initCashback = () => {
    // Scroll to top on load
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh icons
    // @ts-ignore
    if (window.lucide) {
        // @ts-ignore
        window.lucide.createIcons();
    }
};
