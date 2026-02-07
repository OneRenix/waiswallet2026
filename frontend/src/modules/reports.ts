import { state } from '../state';
import { formatCurrency } from '../utils';

declare var $: any;

const renderPieChart = (data: any[], total: number, isDonut = false) => {
    if (total === 0) return `<div class="text-center text-slate-400 p-4">No data available</div>`;

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

        return `<path d="${pathData}" class="pie-slice" style="fill: ${slice.color_code}" data-val="${formatCurrency(slice.value)}" data-label="${slice.label}"></path>`;
    }).join('');

    return `
    <div class="flex flex-col items-center animate-zoom-in">
        <div class="relative w-56 h-56">
            <svg viewBox="-1.2 -1.2 2.4 2.4" class="w-full h-full -rotate-90">
                ${slices}
                <circle cx="0" cy="0" r="${isDonut ? 0.65 : 0.65}" class="fill-white"></circle>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span class="text-xs text-slate-500">Total</span>
                <span class="text-xl font-bold text-slate-900">${formatCurrency(total)}</span>
            </div>
        </div>
        <div class="mt-6 flex flex-wrap justify-center gap-3">
            ${data.map(d => `<div class="flex items-center gap-1.5 text-xs font-medium text-slate-600"><span class="w-3 h-3 rounded-full" style="background-color: ${d.color_code}"></span>${d.label} (${Math.round((d.value / total) * 100)}%)</div>`).join('')}
        </div>
    </div>`;
};

export const renderReports = () => {
    const { reportDate } = state;
    const monthYear = reportDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const txs = state.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === reportDate.getMonth() && d.getFullYear() === reportDate.getFullYear();
    });

    const income = txs.filter(t => t.category === 'income').reduce((a, b) => a + b.amount, 0);
    const expenses = txs.filter(t => t.category !== 'income').reduce((a, b) => a + b.amount, 0);
    const savings = Math.max(0, income - expenses);
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

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
                                <p class="text-[10px] text-slate-400">${Math.round((c.value / expenses) * 100)}% of total</p>
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

export const initReports = () => {
    $(document).off('click', '#btn-report-prev').on('click', '#btn-report-prev', () => {
        state.reportDate.setMonth(state.reportDate.getMonth() - 1);
        // @ts-ignore
        window.app.render();
    });

    $(document).off('click', '#btn-report-next').on('click', '#btn-report-next', () => {
        state.reportDate.setMonth(state.reportDate.getMonth() + 1);
        // @ts-ignore
        window.app.render();
    });
};
