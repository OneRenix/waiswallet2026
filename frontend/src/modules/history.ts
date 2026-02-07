import { state } from '../state';
import { formatCurrency } from '../utils';

declare var $: any;

export const renderHistory = () => {
    const { mode, date, filter, walletId } = state.historyView;

    let filteredTxs = state.transactions.filter(t => {
        const d = new Date(t.date);
        if (mode === 'monthly') return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
        if (mode === 'daily') return d.toDateString() === date.toDateString();
        return d.getFullYear() === date.getFullYear();
    });

    if (filter !== 'all') {
        filteredTxs = filteredTxs.filter(t => filter === 'income' ? t.category === 'income' : t.category !== 'income');
    }

    if (walletId !== 'all') {
        filteredTxs = filteredTxs.filter(t => t.cardId == walletId);
    }

    filteredTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const dateLabel = mode === 'monthly' ? date.toLocaleString('default', { month: 'long', year: 'numeric' })
        : mode === 'daily' ? date.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })
            : date.getFullYear().toString();

    // SOA Summary Logic
    let soaHeader = '';
    if (walletId !== 'all') {
        const wallet = state.cards.find(c => c.id == walletId);
        const periodTotalExpense = filteredTxs.filter(t => t.category !== 'income').reduce((a, b) => a + b.amount, 0);
        const periodTotalIncome = filteredTxs.filter(t => t.category === 'income').reduce((a, b) => a + b.amount, 0);

        soaHeader = `
        <div class="mb-6 p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg animate-slide-in">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statement of Account</p>
                    <h3 class="text-xl font-black">${wallet ? wallet.name : 'Unknown Card'}</h3>
                </div>
                <div class="p-2 bg-white/10 rounded-xl">
                    <i data-lucide="${wallet?.icon || 'credit-card'}" class="w-5 h-5 text-blue-300"></i>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase">Period Spend</p>
                    <p class="text-xl font-bold">${formatCurrency(periodTotalExpense)}</p>
                </div>
                <div class="text-right">
                    <p class="text-[10px] font-bold text-slate-400 uppercase">Period Income</p>
                    <p class="text-xl font-bold text-emerald-400">${formatCurrency(periodTotalIncome)}</p>
                </div>
            </div>
        </div>`;
    }

    const walletFilters = `
    <div class="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-4">
        <button class="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold ${walletId === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'} transition-all btn-wallet-filter" data-id="all">
            All Wallets
        </button>
        ${state.cards.map(c => `
            <button class="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold ${walletId === c.id ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-500 border border-slate-200'} transition-all btn-wallet-filter flex items-center gap-2" data-id="${c.id}">
                <i data-lucide="${c.icon}" class="w-3 h-3"></i> ${c.name}
            </button>
        `).join('')}
    </div>`;

    return `
    <div class="animate-slide-in">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <h2 class="text-2xl font-bold flex items-center gap-2 text-slate-900">
                <i data-lucide="history" class="text-blue-600"></i> Transaction History
            </h2>
            <div class="flex gap-2">
                 <button class="px-3 py-1.5 rounded-lg text-xs font-bold ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200'} transition-all btn-history-type" data-type="all">All</button>
                 <button class="px-3 py-1.5 rounded-lg text-xs font-bold ${filter === 'expense' ? 'bg-rose-500 text-white' : 'bg-white text-slate-500 border border-slate-200'} transition-all btn-history-type" data-type="expense">Expense</button>
                 <button class="px-3 py-1.5 rounded-lg text-xs font-bold ${filter === 'income' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500 border border-slate-200'} transition-all btn-history-type" data-type="income">Income</button>
            </div>
        </div>

        ${walletFilters}
        ${soaHeader}

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
                                   <div class="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase">
                                        <i data-lucide="${card?.icon || 'credit-card'}" class="w-2.5 h-2.5"></i>
                                        ${card ? card.name : 'Unknown'}
                                   </div>
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

export const initHistory = () => {
    $(document).off('click', '.btn-history-type').on('click', '.btn-history-type', function (this: HTMLElement) {
        state.historyView.filter = $(this).data('type');
        // @ts-ignore
        window.app.render();
    });

    $(document).off('click', '.btn-wallet-filter').on('click', '.btn-wallet-filter', function (this: HTMLElement) {
        const id = $(this).data('id');
        state.historyView.walletId = id === 'all' ? 'all' : Number(id);
        // @ts-ignore
        window.app.render();
    });

    $(document).off('click', '.btn-history-filter').on('click', '.btn-history-filter', function (this: HTMLElement) {
        state.historyView.mode = $(this).data('mode');
        // @ts-ignore
        window.app.render();
    });

    $(document).off('click', '#btn-history-prev').on('click', '#btn-history-prev', () => {
        const { mode, date } = state.historyView;
        if (mode === 'monthly') date.setMonth(date.getMonth() - 1);
        else if (mode === 'daily') date.setDate(date.getDate() - 1);
        else date.setFullYear(date.getFullYear() - 1);
        // @ts-ignore
        window.app.render();
    });

    $(document).off('click', '#btn-history-next').on('click', '#btn-history-next', () => {
        const { mode, date } = state.historyView;
        if (mode === 'monthly') date.setMonth(date.getMonth() + 1);
        else if (mode === 'daily') date.setDate(date.getDate() + 1);
        else date.setFullYear(date.getFullYear() + 1);
        // @ts-ignore
        window.app.render();
    });
};
