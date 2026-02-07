import { state } from '../state';
import { formatCurrency, getCycleStatus } from '../utils';

declare var $: any;

export const renderDashboard = () => {
    const totalIncome = state.totalIncome;
    const currentMonthStr = state.currentDate.toISOString().slice(0, 7); // "2026-02"

    const monthlyTransactions = state.transactions.filter(t =>
        t.billingDate && t.billingDate.startsWith(currentMonthStr)
    );

    const totalExpenses = monthlyTransactions.filter(t => t.category !== 'income').reduce((a, t) => a + t.amount, 0);
    const totalCashback = state.cards.reduce((a, c) => a + c.cashbackYTD, 0);
    // @ts-ignore
    const totalBudget = Object.values(state.categoryBudgets).reduce((a, b) => a + (b as number), 0);

    const dateHeader = state.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();

    const catSpending: Record<string, number> = {};
    monthlyTransactions.filter(t => t.category !== 'income').forEach(t => {
        catSpending[t.category] = (catSpending[t.category] || 0) + t.amount;
    });

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
            <div id="card-cashback" class="bg-amber-50/50 p-2 md:p-3 rounded-2xl border border-amber-100 flex flex-col justify-center cursor-pointer hover:bg-amber-100/50 transition-colors shadow-sm">
                <div class="flex items-center gap-2 mb-1">
                    <div class="hidden md:block p-1.5 bg-amber-100 rounded-lg text-amber-600"><i data-lucide="coins" class="w-3 h-3"></i></div>
                    <p class="text-[10px] font-bold text-amber-600 uppercase">Estimated Cashback</p>
                </div>
                <p class="text-sm md:text-2xl font-black text-slate-900 truncate">${formatCurrency(totalCashback)}</p>
            </div>
        </div>
    </div>`;

    const recHtml = `
    <section class="mb-8 animate-slide-in" style="animation-delay: 0.1s">
        <div class="bg-gradient-to-br from-blue-700 to-indigo-800 text-white p-6 rounded-2xl relative overflow-hidden shadow-xl group">
            <div class="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors duration-500"></div>
            <div class="relative z-10">
                <div class="flex items-center gap-2 mb-6">
                    <i data-lucide="sparkles" class="text-yellow-400 fill-current"></i>
                    <h2 class="text-xl font-bold">Smart Recommendations</h2>
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

    const catHtml = state.categories.slice(0, 7).map(cat => {
        if (cat.id === 'income') return '';
        // @ts-ignore
        const budget = state.categoryBudgets[cat.id] || 1;
        const spent = catSpending[cat.id] || 0;
        const pctSpent = Math.min((spent / budget) * 100, 100);
        const isOver = spent > budget;

        return `
        <div class="mb-2">
            <div class="flex justify-between items-end mb-1.5">
                <div class="flex items-center gap-2">
                    <div class="p-1 px-1.5 rounded-lg ${cat.bg} ${cat.color}">
                        <i data-lucide="${cat.icon}" class="w-3 h-3"></i>
                    </div>
                    <span class="text-xs font-bold text-slate-700">${cat.label}</span>
                </div>
                <div class="text-right flex items-center gap-2">
                     <span class="text-xs font-bold ${isOver ? 'text-rose-500' : 'text-slate-500'}">${Math.round(pctSpent)}%</span>
                     <span class="text-[10px] font-bold text-slate-400">|</span>
                     <div class="text-[10px] font-bold text-slate-400">${formatCurrency(spent)} / ${formatCurrency(budget)}</div>
                </div>
            </div>
            <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full ${isOver ? 'bg-rose-500' : ''}" style="width: ${pctSpent}%; ${isOver ? '' : `background-color: ${cat.color_code}`}"></div>
            </div>
        </div>`;
    }).join('');

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
                <div class="h-full bg-blue-600 rounded-full transition-all duration-1000 relative z-10" style="width: ${Math.min((totalExpenses / totalBudget) * 100, 100)}%"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                ${catHtml}
            </div>
            ${goalsHtml}
        </div>
    </section>`;

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

export const initDashboard = () => {
    $(document).off('click', '#btn-see-all-recs').on('click', '#btn-see-all-recs', () => {
        // @ts-ignore
        window.app.switchView('recommendations');
    });

    $(document).off('click', '#card-cashback').on('click', '#card-cashback', () => {
        // @ts-ignore
        window.app.switchView('cashback');
    });

    $(document).off('click', '#btn-view-goals').on('click', '#btn-view-goals', () => {
        // @ts-ignore
        window.app.switchView('goals');
    });

    $(document).off('click', '#btn-view-transactions').on('click', '#btn-view-transactions', () => {
        // @ts-ignore
        window.app.switchView('history');
    });

    $(document).off('submit', '.form-main-chat').on('submit', '.form-main-chat', function (this: HTMLElement, e: any) {
        e.preventDefault();
        const query = $(this).find('.main-chat-input').val();
        if (!query) return;

        // Open chat modal and pass the query
        $('#modal-chat').removeClass('hidden').addClass('flex');
        $('#chat-input').val(query);
        $('#form-chat').submit();
        $(this).find('.main-chat-input').val('');
    });
};
