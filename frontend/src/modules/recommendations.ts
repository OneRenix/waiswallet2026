import { state } from '../state';
import { formatCurrency } from '../utils';

declare var $: any;

export const renderRecommendations = () => {
    const categories = ['pending', 'snoozed', 'acted_upon', 'dismissed'];
    const urgencyLevels = ['critical', 'high', 'medium', 'low'];

    const getUrgencyColor = (level: string) => {
        switch (level) {
            case 'critical': return 'bg-rose-600/20 border-rose-500/50 text-rose-700';
            case 'high': return 'bg-amber-600/20 border-amber-500/50 text-amber-700';
            case 'medium': return 'bg-blue-600/20 border-blue-500/50 text-blue-700';
            case 'low': return 'bg-slate-600/20 border-slate-500/50 text-slate-700';
            default: return 'bg-white/10 border-white/20 text-white';
        }
    };

    const getUrgencyBadge = (level: string) => {
        switch (level) {
            case 'critical': return 'bg-rose-500';
            case 'high': return 'bg-amber-500';
            case 'medium': return 'bg-blue-500';
            case 'low': return 'bg-slate-500';
            default: return 'bg-slate-400';
        }
    };

    const groupedRecs = state.recommendations.reduce((acc: any, rec: any) => {
        const cat = rec.status || 'pending';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(rec);
        return acc;
    }, {});

    const renderCard = (rec: any) => {
        const urgencyColor = getUrgencyColor(rec.urgency_level);
        const badgeColor = getUrgencyBadge(rec.urgency_level);

        return `
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all p-5 flex flex-col justify-between h-full" data-id="${rec.id}">
            <div>
                <div class="flex items-center justify-between mb-4">
                    <span class="text-[10px] font-bold ${badgeColor} px-2 py-1 rounded text-white uppercase tracking-wider">${rec.urgency_level}</span>
                    <i data-lucide="${rec.icon}" class="w-5 h-5 text-slate-400"></i>
                </div>
                <h3 class="font-bold text-slate-900 mb-2 leading-tight">${rec.title}</h3>
                <p class="text-xs text-slate-600 leading-relaxed mb-4">${rec.desc}</p>
                ${rec.amount ? `<p class="text-lg font-black text-slate-900 mb-4">${formatCurrency(rec.amount)}</p>` : ''}
            </div>
            
            <div class="flex flex-wrap gap-2 pt-4 border-t border-slate-50 mt-auto">
                ${rec.status === 'pending' || rec.status === 'snoozed' ? `
                    <button class="btn-action-rec text-[10px] font-bold px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors uppercase" data-action="acted_upon" data-id="${rec.id}">Done</button>
                    <button class="btn-action-rec text-[10px] font-bold px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors uppercase" data-action="snoozed" data-id="${rec.id}">Snooze</button>
                ` : ''}
                ${rec.status !== 'dismissed' ? `
                    <button class="btn-action-rec text-[10px] font-bold px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors uppercase" data-action="dismissed" data-id="${rec.id}">Dismiss</button>
                ` : ''}
                ${rec.status !== 'pending' ? `
                    <button class="btn-action-rec text-[10px] font-bold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors uppercase" data-action="pending" data-id="${rec.id}">Set Pending</button>
                ` : ''}
            </div>
        </div>`;
    };

    const sectionsHtml = categories.map(cat => {
        const recs = groupedRecs[cat] || [];
        if (recs.length === 0 && cat !== 'pending') return '';

        return `
        <div class="mb-10">
            <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                ${cat.replace('_', ' ')} 
                <span class="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px]">${recs.length}</span>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${recs.length > 0 ? recs.map((r: any) => renderCard(r)).join('') : `
                    <div class="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <i data-lucide="info" class="w-8 h-8 text-slate-300 mx-auto mb-3"></i>
                        <p class="text-slate-400 font-medium">No ${cat} recommendations right now.</p>
                    </div>
                `}
            </div>
        </div>`;
    }).join('');

    return `
    <div class="animate-slide-in">
        <header class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 class="text-3xl font-black text-slate-900 tracking-tight">Smart Recommendations</h1>
                <p class="text-slate-500 mt-1">AI-powered insights to optimize your financial strategy.</p>
            </div>
            <div class="flex items-center gap-2">
                 <button class="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors" onclick="window.app.render()">
                    <i data-lucide="refresh-cw" class="w-5 h-5"></i>
                 </button>
            </div>
        </header>
        ${sectionsHtml}
    </div>`;
};

export const initRecommendations = () => {
    $(document).off('click', '.btn-action-rec').on('click', '.btn-action-rec', async function (this: HTMLElement) {
        const id = $(this).data('id');
        const action = $(this).data('action');

        // Show loading state or immediate feedback if desired
        $(this).prop('disabled', true).addClass('opacity-50');

        await state.updateRecommendation(id, action);

        // Refresh the view
        // @ts-ignore
        window.app.render();
    });
};
