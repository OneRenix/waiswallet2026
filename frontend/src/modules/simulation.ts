import { state } from '../state';
import { formatCurrency } from '../utils';

declare var $: any;
declare var lucide: any;

export const renderSimulation = () => {
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
                <div>
                     <label class="block text-[10px] font-bold text-slate-500 uppercase mb-2">Payment Type</label>
                     <div class="flex gap-2">
                        <button type="button" class="btn-sim-payment flex-1 py-2 rounded-xl text-xs font-bold border transition-colors bg-blue-600 text-white border-blue-600" data-type="straight">Straight</button>
                        <button type="button" class="btn-sim-payment flex-1 py-2 rounded-xl text-xs font-bold border transition-colors bg-white text-slate-500 border-slate-200" data-type="installment">Installment</button>
                     </div>
                </div>
                <div id="sim-term-wrapper" class="hidden animate-slide-down">
                     <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Installment Term (Months)</label>
                     <select id="sim-term" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900">
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">12 Months</option>
                        <option value="24">24 Months</option>
                     </select>
                </div>
                <button id="btn-run-sim" class="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2">
                    <i data-lucide="play" class="w-4 h-4"></i> Run Budget Simulation
                </button>
            </div>
            <div id="sim-result" class="bg-indigo-50/30 rounded-2xl border-2 border-dashed border-indigo-100 p-8 flex flex-col items-center justify-center text-indigo-300">
                <i data-lucide="sparkles" class="w-12 h-12 mb-4 opacity-50"></i>
                <p class="text-sm font-medium">Input scenario details to see projection</p>
            </div>
        </div>
    </div>`;
};

export const initSimulation = () => {
    $(document).off('click', '.btn-sim-payment').on('click', '.btn-sim-payment', function (this: HTMLElement) {
        const type = $(this).data('type');
        $('.btn-sim-payment').removeClass('bg-blue-600 text-white border-blue-600').addClass('bg-white text-slate-500 border-slate-200');
        $(this).removeClass('bg-white text-slate-500 border-slate-200').addClass('bg-blue-600 text-white border-blue-600');
        if (type === 'installment') $('#sim-term-wrapper').removeClass('hidden');
        else $('#sim-term-wrapper').addClass('hidden');
    });

    $(document).off('click', '#btn-run-sim').on('click', '#btn-run-sim', () => {
        const amount = parseFloat(($('#sim-amount').val() as string));
        const cardId = $('#sim-card').val();
        const card = state.cards.find(c => c.id == cardId);
        const categoryText = $("#sim-cat option:selected").text();

        if (!amount || !card) return;

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
                </div>
                <div class="p-3 bg-slate-50 text-slate-700 rounded-xl text-sm border border-slate-100 flex gap-2 items-start">
                     <i data-lucide="credit-card" class="w-4 h-4 mt-0.5 text-slate-400"></i>
                     <div>
                        <span class="font-bold">Card Status:</span> ${card.cycleDate ? 'Cycle Ending Soon.' : 'Normal status.'}
                     </div>
                </div>
            </div>
        </div>`;
        $('#sim-result').html(resultHtml).removeClass('text-indigo-300').addClass('text-slate-900');
        lucide.createIcons({ root: document.getElementById('sim-result') });
    });
};
