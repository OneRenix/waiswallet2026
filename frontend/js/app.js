import { chatWithPilot, scanReceipt, fileToBase64 } from '../services/geminiService.js';

// --- Global State ---
const state = {
    currentView: 'dashboard',
    currentDate: new Date("2026-01-24"),
    darkMode: false,
    cards: [
        {
            id: 1, name: "Amore Cashback", provider: "BPI", balance: 15450.00, limit: 150000.00,
            dueDate: "2026-02-05", cycleDate: "2026-01-26", color: "from-rose-700 to-red-900",
            benefits: { groceries: 0.04, drugstores: 0.01, utilities: 0.01, default: 0.003 },
            type: "credit", cashbackCap: 15000, cashbackYTD: 4200, icon: "heart"
        },
        {
            id: 2, name: "Visa Platinum", provider: "EastWest", balance: 42300.50, limit: 300000.00,
            dueDate: "2026-01-28", cycleDate: "2026-01-15", color: "from-slate-700 to-slate-900",
            benefits: { dining: 0.0888, travel: 0.0888, utilities: 0.0888, fuel: 0.0888, shopping: 0.0888, default: 0.003 },
            type: "credit", cashbackCap: 15000, cashbackYTD: 8150, icon: "platinum"
        },
        {
            id: 3, name: "Everyday Debit", provider: "UnionBank", balance: 28500.00, limit: null,
            dueDate: null, cycleDate: null, color: "from-orange-500 to-orange-700",
            benefits: { default: 0.0 }, type: "debit", cashbackCap: null, cashbackYTD: 0, icon: "wallet"
        },
        {
            id: 4, name: "Cash on Hand", provider: "Physical Wallet", balance: 3200.00, limit: null,
            dueDate: null, cycleDate: null, color: "from-emerald-600 to-emerald-800",
            benefits: { default: 0.0 }, type: "cash", cashbackCap: null, cashbackYTD: 0, icon: "cash"
        }
    ],
    transactions: [
        { id: 1, merchant: "Landers Superstore", amount: 6500, category: "groceries", date: "2026-01-23", cardId: 1, type: "straight", cashback: 260 },
        { id: 2, merchant: "Wildflour Cafe", amount: 1240, category: "dining", date: "2026-01-23", cardId: 2, type: "straight", cashback: 110.11 },
        { id: 3, merchant: "Meralco", amount: 3200, category: "utilities", date: "2026-01-22", cardId: 2, type: "straight", cashback: 284.16 },
        { id: 4, merchant: "Abenson", amount: 24000, category: "shopping", date: "2026-01-10", cardId: 1, type: "installment", installments: "12mo", cashback: 72 }, 
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

const CATEGORIES = [
    { id: 'groceries', label: 'Groceries', color: 'text-green-600', bg: 'bg-green-100', fill: 'fill-green-500' },
    { id: 'dining', label: 'Dining', color: 'text-orange-600', bg: 'bg-orange-100', fill: 'fill-orange-500' },
    { id: 'fuel', label: 'Fuel', color: 'text-red-600', bg: 'bg-red-100', fill: 'fill-red-500' },
    { id: 'utilities', label: 'Utilities', color: 'text-blue-600', bg: 'bg-blue-100', fill: 'fill-blue-500' },
    { id: 'travel', label: 'Travel', color: 'text-purple-600', bg: 'bg-purple-100', fill: 'fill-purple-500' },
    { id: 'shopping', label: 'Shopping', color: 'text-pink-600', bg: 'bg-pink-100', fill: 'fill-pink-500' },
    { id: 'others', label: 'Others', color: 'text-slate-600', bg: 'bg-slate-100', fill: 'fill-slate-500' }
];

// --- Helper Functions ---

const formatCurrency = (val) => `₱${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const getCycleStatus = (cycleDateStr, currentDate) => {
    if (!cycleDateStr) return { status: 'na', color: 'bg-slate-200', text: 'N/A', width: '0%', label: 'N/A' };
    const cycleDay = new Date(cycleDateStr).getDate();
    const currentDay = currentDate.getDate();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    let daysPassed = currentDay - cycleDay;
    if (daysPassed < 0) daysPassed += daysInMonth;
    
    if (daysPassed <= 10) return { status: 'great', color: 'bg-emerald-500', label: 'Great Timing', width: '15%' };
    if (daysPassed <= 20) return { status: 'good', color: 'bg-yellow-500', label: 'Good Timing', width: '50%' };
    return { status: 'poor', color: 'bg-rose-500', label: 'Due Soon', width: '90%' };
};

// --- DOM Rendering ---

const renderPieChart = (data, total, elementId) => {
    const $container = $(`#${elementId}`).empty();
    if(total === 0) return;

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
        
        const pathData = slicePercent >= 1 
            ? `M 1 0 A 1 1 0 1 1 -1 0 A 1 1 0 1 1 1 0 Z`
            : `M ${x} ${y} A 1 1 0 ${largeArc} 1 ${endX} ${endY} L 0 0`;
            
        return `<path d="${pathData}" class="pie-slice ${slice.fill}" data-val="${formatCurrency(slice.value)}" data-label="${slice.label}"></path>`;
    }).join('');

    const svg = `
    <div class="flex flex-col items-center">
        <div class="relative w-48 h-48">
            <svg viewBox="-1.2 -1.2 2.4 2.4" class="w-full h-full -rotate-90">
                ${slices}
                <circle cx="0" cy="0" r="0.65" class="fill-white dark:fill-slate-800"></circle>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span class="text-xs text-slate-500">Total</span>
                <span class="text-lg font-bold">${formatCurrency(total)}</span>
            </div>
        </div>
        <div class="mt-4 flex flex-wrap justify-center gap-2">
            ${data.map(d => `<div class="flex items-center gap-1.5 text-xs text-slate-500"><span class="w-2.5 h-2.5 rounded-full ${d.bg}"></span>${d.label}</div>`).join('')}
        </div>
    </div>`;
    
    $container.html(svg);
};

// --- View Renderers ---

const renderDashboard = () => {
    const totalIncome = 80000;
    const totalExpenses = state.transactions.reduce((a, t) => a + t.amount, 0);
    const totalCashback = state.cards.reduce((a, c) => a + c.cashbackYTD, 0);
    const totalBudget = Object.values(state.categoryBudgets).reduce((a, b) => a + b, 0);
    const dateStr = state.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Overview Cards
    const overviewHtml = `
    <div class="mb-8">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">${dateStr} OVERVIEW</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 dark:bg-slate-800">
                <p class="text-[10px] font-bold text-emerald-600 uppercase mb-1">Income</p>
                <p class="text-lg font-bold text-slate-900 dark:text-white">${formatCurrency(totalIncome)}</p>
            </div>
            <div class="bg-rose-50/30 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 dark:bg-slate-800">
                <p class="text-[10px] font-bold text-rose-600 uppercase mb-1">Expenses</p>
                <p class="text-lg font-bold text-slate-900 dark:text-white">${formatCurrency(totalExpenses)}</p>
            </div>
            <div class="bg-amber-50/30 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 dark:bg-slate-800">
                <p class="text-[10px] font-bold text-amber-600 uppercase mb-1">Cashback</p>
                <p class="text-lg font-bold text-slate-900 dark:text-white">${formatCurrency(totalCashback)}</p>
            </div>
        </div>
    </div>`;

    // AI Recommendations (Static for now based on logic)
    const recHtml = `
    <section class="mb-8">
        <div class="bg-gradient-to-br from-blue-700 to-indigo-800 text-white p-6 rounded-2xl relative overflow-hidden shadow-xl">
            <div class="relative z-10">
                <div class="flex items-center gap-2 mb-6">
                    <i data-lucide="sparkles" class="text-yellow-400 fill-current"></i>
                    <h2 class="text-xl font-bold">Strategic Recommendations</h2>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-colors">
                        <h4 class="font-bold text-sm text-white">Emergency Fund First</h4>
                        <p class="text-xs text-indigo-100 mt-1 opacity-90">Ensure your emergency fund covers at least 3 months.</p>
                     </div>
                </div>
            </div>
        </div>
    </section>`;

    // Budget Navigator
    const budgetHtml = `
    <section class="mb-8">
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div class="flex justify-between items-start mb-6">
                <div class="flex items-center gap-3">
                    <div class="p-2.5 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-600"><i data-lucide="bar-chart-3"></i></div>
                    <div><h2 class="text-lg font-bold">Budget Navigator</h2><p class="text-xs text-slate-500">Monthly limits</p></div>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-black text-slate-900 dark:text-white">${formatCurrency(totalExpenses)} <span class="text-base font-medium text-slate-400">/ ${formatCurrency(totalBudget)}</span></p>
                </div>
            </div>
            <div class="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-8">
                <div class="h-full bg-blue-600 rounded-full transition-all duration-1000" style="width: ${Math.min((totalExpenses/totalBudget)*100, 100)}%"></div>
            </div>
            <!-- Categories breakdown logic would loop here -->
        </div>
    </section>`;

    // Recent Activity List
    const txHtml = state.transactions.slice(0, 5).map(t => {
        const cardName = state.cards.find(c => c.id == t.cardId)?.name || 'Unknown';
        return `
        <div class="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0">
            <div class="flex items-center gap-3">
                <div class="p-2 bg-slate-100 dark:bg-slate-900 rounded-full"><i data-lucide="activity" class="w-4 h-4"></i></div>
                <div>
                    <p class="text-sm font-bold text-slate-900 dark:text-white">${t.merchant}</p>
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                        <span>${t.date}</span>
                        <span class="capitalize px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500">${t.category}</span>
                    </div>
                </div>
            </div>
            <div class="text-right">
                <span class="block font-bold text-slate-900 dark:text-white">-${formatCurrency(t.amount)}</span>
                <span class="text-[10px] text-slate-400">${cardName}</span>
            </div>
        </div>`;
    }).join('');

    const activityHtml = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
             <!-- Card Strategy Cards (Simplified Loop) -->
             ${state.cards.map(c => `
                <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden mb-4">
                    <div class="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${c.color}"></div>
                    <div class="p-5">
                        <div class="flex justify-between mb-4">
                            <div><p class="text-[10px] font-bold text-slate-400 uppercase">${c.provider}</p><h4 class="font-bold text-slate-900 dark:text-white">${c.name}</h4></div>
                            <div class="text-right"><p class="font-bold text-slate-900 dark:text-white">${formatCurrency(c.balance)}</p></div>
                        </div>
                    </div>
                </div>
             `).join('')}
        </div>
        <div>
             <h3 class="text-lg font-bold flex items-center gap-2 mb-6 text-slate-900 dark:text-white"><i data-lucide="activity" class="text-rose-500"></i> Recent Activity</h3>
             <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                ${txHtml}
             </div>
        </div>
    </div>`;

    // Search Bar
    const searchBar = `
    <div class="max-w-[650px] mx-auto w-full mb-10">
        <form class="relative form-main-chat">
            <div class="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <i data-lucide="sparkles" class="text-blue-500 animate-pulse w-5 h-5"></i>
            </div>
            <input type="text" placeholder="Ask WaisWallet..." class="w-full pl-14 pr-16 py-4 bg-white dark:bg-slate-800 rounded-full border-2 border-slate-200 dark:border-slate-700 shadow-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white transition-all placeholder:text-slate-400 main-chat-input">
            <button type="submit" class="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2.5 rounded-full shadow-md"><i data-lucide="arrow-right" class="w-5 h-5"></i></button>
        </form>
    </div>`;

    return searchBar + overviewHtml + recHtml + budgetHtml + activityHtml;
};

// Simulation View
const renderSimulation = () => {
    return `
    <div class="space-y-6 animate-slide-in">
        <h2 class="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <i data-lucide="calculator" class="text-blue-600"></i> Budget Simulator
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <h3 class="font-bold text-slate-900 dark:text-white">Scenario Input</h3>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Simulated Purchase (₱)</label>
                    <input type="number" id="sim-amount" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none text-lg font-bold text-slate-900 dark:text-white" value="${state.simData.amount}" placeholder="0.00">
                </div>
                <div>
                     <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                     <select id="sim-cat" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
                        ${CATEGORIES.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
                     </select>
                </div>
                <!-- Funding Source -->
                <div>
                     <label class="block text-xs font-semibold text-slate-500 mb-1">Funding Source</label>
                     <select id="sim-card" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
                        ${state.cards.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                     </select>
                </div>
                <button id="btn-run-sim" class="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg">Run Pilot Check</button>
            </div>
            <div class="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border-dashed border-2 border-slate-200 dark:border-slate-700 flex flex-col justify-center items-center" id="sim-result">
                <i data-lucide="brain" class="w-10 h-10 mb-2 opacity-20 text-slate-400"></i>
                <p class="text-sm italic text-slate-400">Define a purchase to see the impact.</p>
            </div>
        </div>
    </div>`;
};

// --- App Logic ---

const app = {
    init: () => {
        app.render();
        app.attachEvents();
        lucide.createIcons();
    },

    switchView: (viewName) => {
        state.currentView = viewName;
        app.render();
    },

    render: () => {
        const $container = $('#main-container');
        $container.empty();
        
        // Hide/Close Menus
        $('#slide-menu').addClass('hidden');

        if (state.currentView === 'dashboard') $container.html(renderDashboard());
        else if (state.currentView === 'simulation') $container.html(renderSimulation());
        // ... other views would follow similar pattern ...
        else $container.html(`<div class="text-center p-10"><h2 class="text-2xl font-bold">View: ${state.currentView}</h2><p>Coming soon...</p></div>`);

        lucide.createIcons();
    },

    attachEvents: () => {
        // Theme Toggle
        $('#btn-theme-toggle').on('click', () => {
            state.darkMode = !state.darkMode;
            $('html').toggleClass('dark');
        });

        // Slide Menu
        $('#btn-menu').on('click', () => $('#slide-menu').removeClass('hidden'));
        $('#btn-close-menu, #slide-menu-backdrop').on('click', () => $('#slide-menu').addClass('hidden'));
        $('.nav-btn').on('click', function() {
            const view = $(this).data('view');
            app.switchView(view);
        });

        // Chat Modal
        $('#fab-chat').on('click', () => $('#modal-chat').removeClass('hidden').addClass('flex'));
        $('.btn-close-modal').on('click', () => $('.fixed.z-\\[80\\]').addClass('hidden').removeClass('flex'));
        
        // Add Tx Modal
        $('#fab-add').on('click', () => {
            // Populate selects
            const $catSelect = $('#inp-category').empty();
            CATEGORIES.forEach(c => $catSelect.append(`<option value="${c.id}">${c.label}</option>`));
            
            const $cardSelect = $('#inp-card').empty();
            state.cards.forEach(c => $cardSelect.append(`<option value="${c.id}">${c.name}</option>`));
            
            $('#modal-add').removeClass('hidden').addClass('flex');
        });

        // Main Chat & Modal Chat
        $(document).on('submit', '#form-chat, .form-main-chat', async function(e) {
            e.preventDefault();
            const $input = $(this).find('input');
            const msg = $input.val().trim();
            if(!msg) return;

            // Open modal if using main search
            if($(this).hasClass('form-main-chat')) {
                $('#modal-chat').removeClass('hidden').addClass('flex');
            }

            // Append User Msg
            const $chatBox = $('#chat-messages');
            $chatBox.append(`
                <div class="flex flex-col items-end">
                    <div class="max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm bg-blue-600 text-white rounded-tr-none">${msg}</div>
                </div>
            `);
            $input.val('');
            $chatBox.scrollTop($chatBox[0].scrollHeight);

            // Append Loading
            const $loading = $(`<div class="text-xs text-slate-400 italic px-2 animate-pulse" id="msg-loading">Wais is analyzing...</div>`).appendTo($chatBox);

            // Call API
            const context = {
                currentDate: state.currentDate,
                cards: state.cards,
                remainingBudget: 50000, // Derived in real app
                categoryBudgets: state.categoryBudgets,
                totalCash: 3200
            };
            const response = await chatWithPilot(msg, context);
            
            $('#msg-loading').remove();
            $chatBox.append(`
                <div class="flex flex-col items-start">
                    <div class="max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none">${response}</div>
                </div>
            `);
            $chatBox.scrollTop($chatBox[0].scrollHeight);
        });

        // Payment Type Toggle in Add Modal
        $('.btn-payment-type').on('click', function() {
            const type = $(this).data('type');
            $('.btn-payment-type').removeClass('bg-blue-600 text-white border-blue-600').addClass('bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700');
            $(this).removeClass('bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700').addClass('bg-blue-600 text-white border-blue-600');
            
            if(type === 'installment') $('#installment-config').removeClass('hidden');
            else $('#installment-config').addClass('hidden');
        });

        // Simulation Run
        $(document).on('click', '#btn-run-sim', () => {
            const amount = parseFloat($('#sim-amount').val());
            const cardId = $('#sim-card').val();
            const card = state.cards.find(c => c.id == cardId);
            
            if(!amount || !card) return;

            const resultHtml = `
            <div class="text-left w-full space-y-2">
                <p class="font-bold text-slate-900 dark:text-white">Analysis for ${formatCurrency(amount)} using ${card.name}:</p>
                <div class="p-3 bg-white dark:bg-slate-900 rounded-xl text-sm text-slate-700 dark:text-slate-300">
                    <p>✅ <strong>Cash Flow:</strong> Full one-time payment.</p>
                    <p class="mt-2 text-xs text-slate-500">Ask if 0% installment is available to preserve cash.</p>
                </div>
                ${card.type === 'credit' ? `
                <div class="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm border border-emerald-100 dark:border-emerald-800">
                    🚀 <strong>Float Strategy:</strong> Good timing. Statement cycle aligns well.
                </div>` : ''}
            </div>`;
            
            $('#sim-result').html(resultHtml);
        });
        
        // Receipt Scan (Mock Trigger for now, logic exists in service)
        $('#btn-scan').on('click', () => $('#file-upload').click());
        $('#file-upload').on('change', async (e) => {
             const file = e.target.files[0];
             if(!file) return;
             $('#btn-scan').text('PILOTING...');
             try {
                 const base64 = await fileToBase64(file);
                 const data = await scanReceipt(base64);
                 $('#inp-merchant').val(data.merchant);
                 $('#inp-amount').val(data.amount);
                 // Simple Category Match
                 const catMatch = CATEGORIES.find(c => c.id === data.category?.toLowerCase());
                 if(catMatch) $('#inp-category').val(catMatch.id);
             } catch(err) {
                 alert('Scan failed');
             } finally {
                 $('#btn-scan').text('SCAN NOW');
             }
        });
    }
};

// Global Access
window.app = app;

$(document).ready(() => {
    app.init();
});