import { state } from '../state';
import { formatCurrency } from '../utils';
import { api } from '../services/api';

declare var $: any;
declare var lucide: any;

export const renderSimulation = () => {
    return `
    <div class="space-y-6 animate-slide-in pb-12">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 class="text-2xl font-black flex items-center gap-3 text-slate-900">
                    <div class="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                        <i data-lucide="calculator" class="w-6 h-6"></i>
                    </div>
                    Budget Simulator
                </h2>
                <p class="text-xs text-slate-500 mt-1">Test financial scenarios before you commit to them.</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <!-- Input Column -->
            <div class="lg:col-span-5 space-y-6">
                <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-5">
                    <h3 class="text-sm font-bold text-slate-900 border-b border-slate-50 pb-3">Simulation Parameters</h3>
                    
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">What are you planning?</label>
                        <textarea id="sim-desc" rows="2" class="w-full p-3 rounded-2xl border border-slate-100 bg-slate-50 text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="e.g. New ergonomic chair for home office setup..."></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Amount (₱)</label>
                            <input type="number" id="sim-amount" class="w-full p-3 rounded-2xl border border-slate-100 bg-slate-50 text-lg font-black text-blue-600 outline-none focus:ring-2 focus:ring-blue-500/20" value="${state.simData.amount}" placeholder="0.00">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                             <select id="sim-cat" class="w-full p-3 rounded-2xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-700 outline-none">
                                ${state.categories.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
                             </select>
                        </div>
                    </div>

                    <div>
                         <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Preferred Card</label>
                         <select id="sim-card" class="w-full p-3 rounded-2xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-700 outline-none">
                            ${state.cards.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                         </select>
                    </div>

                    <div>
                         <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Payment Strategy</label>
                         <div class="flex p-1 bg-slate-100 rounded-2xl gap-1">
                            <button type="button" class="btn-sim-payment flex-1 py-2.5 rounded-xl text-xs font-black transition-all bg-white shadow-sm text-blue-600" data-type="straight">STRAIGHT</button>
                            <button type="button" class="btn-sim-payment flex-1 py-2.5 rounded-xl text-xs font-black transition-all text-slate-500 hover:bg-white/50" data-type="installment">INSTALLMENT</button>
                         </div>
                    </div>

                    <div id="sim-term-wrapper" class="hidden animate-slide-down">
                         <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Term (Months)</label>
                         <select id="sim-term" class="w-full p-3 rounded-2xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-700 outline-none">
                            <option value="3">3 Months (Interest Free)</option>
                            <option value="6">6 Months</option>
                            <option value="12">12 Months</option>
                            <option value="24">24 Months</option>
                         </select>
                    </div>

                    <button id="btn-run-sim" class="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                        <i data-lucide="zap" class="w-4 h-4 fill-current"></i> GENERATE PROJECTION
                    </button>
                </div>
            </div>

            <!-- Result Column -->
            <div id="sim-result" class="lg:col-span-7 h-fit min-h-[400px] bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-200/60 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <div class="p-6 bg-white rounded-full shadow-inner mb-4">
                    <i data-lucide="radar" class="w-12 h-12 opacity-20"></i>
                </div>
                <h4 class="font-bold text-slate-600">Awaiting Simulation Data</h4>
                <p class="text-xs max-w-xs mt-2 leading-relaxed">Fill out the parameters on the left to activate the Pilot's strategic projection engine.</p>
            </div>
        </div>
    </div>`;
};

export const initSimulation = () => {
    $(document).off('click', '.btn-sim-payment').on('click', '.btn-sim-payment', function (this: HTMLElement) {
        const type = $(this).data('type');
        $('.btn-sim-payment').removeClass('bg-white shadow-sm text-blue-600').addClass('text-slate-500 hover:bg-white/50');
        $(this).removeClass('text-slate-500 hover:bg-white/50').addClass('bg-white shadow-sm text-blue-600');
        if (type === 'installment') $('#sim-term-wrapper').removeClass('hidden');
        else $('#sim-term-wrapper').addClass('hidden');
    });

    $(document).off('click', '#btn-run-sim').on('click', '#btn-run-sim', async () => {
        const amount = parseFloat(($('#sim-amount').val() as string));
        const cardId = parseInt($('#sim-card').val() as string);
        const card = state.cards.find(c => c.id == cardId);
        const categoryText = $("#sim-cat option:selected").text();
        const description = $('#sim-desc').val();

        if (!amount || !card) return;

        const $btn = $('#btn-run-sim');
        const originalBtnHtml = $btn.html();
        $btn.prop('disabled', true).html('<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> PILOTING...');
        if ((window as any).lucide) (window as any).lucide.createIcons();

        try {
            const paymentType = $('.btn-sim-payment.text-blue-600').data('type') || 'straight';
            const term = paymentType === 'installment' ? parseInt($('#sim-term').val() as string) : 1;

            // Call Backend AI Engine
            const simResult = await api.runSimulation({
                amount,
                category: categoryText,
                card_id: cardId,
                payment_type: paymentType,
                term,
                description
            });

            const scoreColor = simResult.score >= 80 ? 'text-emerald-500' : (simResult.score >= 60 ? 'text-amber-500' : 'text-rose-500');
            const statusColorClass = simResult.is_affordable ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100';
            const statusIcon = simResult.is_affordable ? 'check-circle' : 'alert-circle';

            const resultHtml = `
            <div class="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 w-full animate-zoom-in space-y-8">
                <div class="flex items-start justify-between">
                    <div>
                        <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 inline-block">Strategic Projection</span>
                        <h3 class="text-xl font-black text-slate-900">${description || 'Untitled Scenario'}</h3>
                        <p class="text-xs text-slate-500 mt-1">AI analysis for ${categoryText} on ${card.name}.</p>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-black ${scoreColor}">${simResult.score}%</div>
                        <div class="text-[10px] font-black text-slate-400 uppercase">Wais Score</div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                        <div class="text-[10px] font-black text-slate-400 uppercase mb-1">Monthly Impact</div>
                        <div class="text-lg font-black text-slate-900">${formatCurrency(simResult.monthly_impact)}</div>
                        <div class="text-[10px] text-slate-500">Fixed for ${term} month(s)</div>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                        <div class="text-[10px] font-black text-slate-400 uppercase mb-1">Total Cost</div>
                        <div class="text-lg font-black text-slate-900">${formatCurrency(amount)}</div>
                        <div class="text-[10px] text-slate-500">${paymentType.toUpperCase()} payment</div>
                    </div>
                </div>

                <div class="space-y-4">
                    <h4 class="text-sm font-black text-slate-900 flex items-center gap-2">
                        <i data-lucide="cpu" class="w-4 h-4 text-blue-600"></i> Pilot's Recommendation
                    </h4>
                    
                    <div class="p-4 ${statusColorClass} rounded-3xl text-sm border flex gap-3">
                        <i data-lucide="${statusIcon}" class="w-5 h-5 shrink-0"></i>
                        <div>
                            <p class="font-bold mb-1">${simResult.is_affordable ? 'Looks Solid!' : 'Caution Recommended'}</p>
                            <p class="text-xs opacity-80 leading-relaxed">${simResult.recommendation}</p>
                        </div>
                    </div>

                    <div class="p-4 bg-indigo-50 text-indigo-800 rounded-3xl text-sm border border-indigo-100 flex gap-3">
                        <i data-lucide="navigation" class="w-5 h-5 shrink-0 text-indigo-400"></i>
                        <div>
                            <p class="font-bold mb-1 text-xs uppercase tracking-tight">Best Strategy</p>
                            <p class="text-xs opacity-80 leading-relaxed">${simResult.best_strategy}</p>
                        </div>
                    </div>

                    ${simResult.pro_tips.map((tip: string) => `
                        <div class="p-4 bg-blue-50 text-blue-800 rounded-3xl text-sm border border-blue-100 flex gap-3">
                            <i data-lucide="lightbulb" class="w-5 h-5 shrink-0 text-blue-400"></i>
                            <div>
                                <p class="font-bold mb-1 text-xs uppercase tracking-tight">Wais Pro-Tip</p>
                                <p class="text-xs opacity-80 leading-relaxed">${tip}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <span>AI Engine v1.0.2</span>
                    <span>Context-aware strategy</span>
                </div>
            </div>`;

            $('#sim-result').html(resultHtml).removeClass('flex items-center justify-center text-slate-400 border-dashed border-2 p-8').addClass('p-0 border-none');
            lucide.createIcons({ root: document.getElementById('sim-result') });
        } catch (err) {
            alert('Simulation failed: ' + err);
        } finally {
            $btn.prop('disabled', false).html(originalBtnHtml);
            if ((window as any).lucide) (window as any).lucide.createIcons();
        }
    });
};
