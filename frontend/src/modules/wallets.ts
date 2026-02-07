import { state } from '../state';
import { formatCurrency, getCycleStatus } from '../utils';

declare var $: any;

export const renderWallets = () => {
    const cardsHtml = state.cards.map(c => {
        const util = c.limit ? (c.balance / c.limit) * 100 : 0;
        const utilColor = util > 80 ? 'bg-rose-500' : util > 50 ? 'bg-yellow-500' : 'bg-blue-500';
        const cycle = getCycleStatus(c.cycleDate, state.currentDate);
        const cardColor = c.color || '#3b82f6'; // Default to blue if no color

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
            <div class="h-24 p-4 relative bg-gradient-to-r from-transparent to-black/20" style="background-color: ${cardColor}">
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

export const initWallets = () => {
    $(document).off('click', '#btn-add-wallet').on('click', '#btn-add-wallet', () => {
        $('#modal-wallet-title').text('Add New Wallet');
        $('#inp-wallet-id').val('');
        $('#form-wallet')[0].reset();
        // @ts-ignore
        if (window.populateWalletMultipliers) window.populateWalletMultipliers({});
        // @ts-ignore
        if (window.populateProviders) window.populateProviders('credit');
        $('#modal-wallet').removeClass('hidden').addClass('flex');
    });

    $(document).off('click', '.btn-edit-wallet').on('click', '.btn-edit-wallet', function (this: HTMLElement) {
        const id = $(this).data('id');
        const wallet = state.cards.find(c => c.id === id);
        if (!wallet) return;

        $('#modal-wallet-title').text('Edit Wallet');
        $('#inp-wallet-id').val(wallet.id);
        $('#inp-wallet-balance').val(wallet.balance); // Store balance for payload
        $('#inp-wallet-name').val(wallet.name);

        // Use the global helper to populate and select the correct provider
        // @ts-ignore
        if (window.populateProviders) {
            // @ts-ignore
            window.populateProviders(wallet.type, wallet.provider_id, wallet.provider);
        } else {
            console.error("populateProviders not found on window");
        }

        $('#inp-wallet-type').val(wallet.type);
        $('#inp-wallet-color').val(wallet.color || '#3b82f6');

        // Balance is auto-calculated, no need to set it
        $('#inp-wallet-limit').val(wallet.limit);
        $('#inp-wallet-cap').val(wallet.cashbackCap || wallet.monthlyLimit);

        // Populate dates if they exist (simple day of month mapping for now as per schema)
        // But the input is 'date', so we might need a dummy date for the picker
        if (wallet.dueDate) {
            const d = new Date(state.currentDate);
            d.setDate(parseInt(wallet.dueDate));
            $('#inp-wallet-due-date').val(d.toISOString().split('T')[0]);
        }
        if (wallet.cycleDate) {
            const d = new Date(state.currentDate);
            d.setDate(parseInt(wallet.cycleDate));
            $('#inp-wallet-cycle-date').val(d.toISOString().split('T')[0]);
        }

        // @ts-ignore
        if (window.populateWalletMultipliers) window.populateWalletMultipliers(wallet.benefits || {});

        $('#modal-wallet').removeClass('hidden').addClass('flex');
    });

    $(document).off('click', '.btn-view-wallet-tx').on('click', '.btn-view-wallet-tx', function (this: HTMLElement) {
        const cardId = $(this).data('id');
        const card = state.cards.find(c => c.id === cardId);
        if (!card) return;

        $('#wallet-tx-title').text(`${card.name} Transactions`);
        const $list = $('#wallet-tx-list').empty();
        const txs = state.transactions.filter(t => t.cardId === cardId);

        if (txs.length === 0) {
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
};
