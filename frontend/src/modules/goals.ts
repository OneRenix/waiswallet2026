import { state } from '../state';
import { formatCurrency } from '../utils';

declare var $: any;

export const renderGoals = () => {
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

export const initGoals = () => {
    $(document).off('click', '#btn-add-goal').on('click', '#btn-add-goal', () => {
        $('#goal-id').val('');
        $('#goal-name').val('');
        $('#goal-target').val('');
        $('#goal-current').val('');
        $('#goal-color').val('bg-emerald-500');
        const $source = $('#goal-source').empty().append('<option value="">None</option>');
        state.cards.filter(c => c.type === 'debit' || c.type === 'cash').forEach(c => {
            $source.append(`<option value="${c.id}">${c.name}</option>`);
        });
        $('#modal-goal-title').text('Add Goal');
        $('#modal-goal').removeClass('hidden').addClass('flex');
    });

    $(document).off('click', '.btn-edit-goal').on('click', '.btn-edit-goal', function (this: HTMLElement) {
        const id = $(this).data('id');
        const goal = state.goals.find(g => g.id === id);
        if (!goal) return;
        $('#goal-id').val(goal.id);
        $('#goal-name').val(goal.name);
        $('#goal-target').val(goal.target);
        $('#goal-current').val(goal.current);
        $('#goal-color').val(goal.color);
        const $source = $('#goal-source').empty().append('<option value="">None</option>');
        state.cards.filter(c => c.type === 'debit' || c.type === 'cash').forEach(c => {
            const selected = c.id === goal.sourceId ? 'selected' : '';
            $source.append(`<option value="${c.id}" ${selected}>${c.name}</option>`);
        });
        $('#modal-goal-title').text('Edit Goal');
        $('#modal-goal').removeClass('hidden').addClass('flex');
    });
};
