import { CardData, Transaction } from './types';
import { api } from './services/api';

// --- Global State ---
export const state = {
    currentView: 'dashboard',
    currentDate: new Date("2026-02-07"),
    reportDate: new Date("2026-02-07"),
    currency: 'PHP',
    country: 'Philippines',
    entryType: 'expense',
    historyView: {
        mode: 'monthly',
        date: new Date("2026-02-07"),
        filter: 'all',
        walletId: 'all' as number | 'all'
    },
    cards: [] as CardData[],
    transactions: [] as Transaction[],
    goals: [] as any[],
    categories: [] as any[],
    recommendations: [] as any[],
    categoryBudgets: {} as Record<string, number>,
    totalIncome: 0,
    messages: [
        { id: 1, sender: 'buddy', text: "Hi! I'm Wais Wallet AI pilot, your strategic financial co-pilot. How can I assist you in optimizing your finances today?", feedback: null }
    ],
    simData: {
        amount: '', cardId: 1, category: 'shopping', paymentType: 'straight',
        installments: '3', urgency: 'now', goalId: ''
    },

    async refresh() {
        try {
            const data = await api.getState();

            // Enrich Categories with UI properties
            this.categories = data.categories.map((c: any) => ({
                ...c,
                id: c.code, // Use code as ID for frontend logic consistency
                numericId: c.id, // Keep numeric ID for DB relationships (e.g. benefits)
                bg: this.mapColorToBg(c.color_code),
                color: this.mapColorToText(c.color_code),
                icon: c.icon_name || 'circle'
            }));

            // Enrich Wallets
            this.cards = data.wallets.map((w: any) => {
                const cb = data.cashbackMTD.find((c: any) => c.wallet_id === w.id);
                return {
                    ...w,
                    id: w.id,
                    balance: w.balance,
                    limit: w.credit_limit,
                    cashbackYTD: w.cashback_ytd || 0,
                    cashbackMTD: cb ? cb.amount_earned : 0,
                    monthlyLimit: cb ? cb.monthly_limit : w.monthly_cashback_limit,
                    color: w.color || (w.type === 'credit' ? '#4f46e5' : '#10b981'), // Use DB color or default hex (Indigo-600 / Emerald-500)
                    icon: w.type === 'credit' ? 'credit-card' : 'wallet',
                    dueDate: w.due_day,
                    cycleDate: w.cycle_day,
                    benefits: w.benefits || {}  // API now returns benefits as object from wallet_benefits table
                };
            });

            // Map Transactions
            this.transactions = data.transactions.map((t: any) => {
                const cat = data.categories.find((c: any) => c.id === t.category_id);
                return {
                    ...t,
                    id: t.id,
                    amount: t.line_amount, // Use the specific line amount, not the header total
                    merchant: t.merchant,
                    date: t.transaction_date,
                    billingDate: t.billing_date,
                    category: cat ? cat.code : 'other',
                    cardId: t.wallet_id,
                    cashback: t.cashback_earned || 0
                };
            });

            this.goals = data.goals.map((g: any) => ({
                ...g,
                current: g.current_amount,
                target: g.target_amount,
                color: g.color || 'bg-blue-600',
                icon: g.icon || 'target'
            }));

            this.recommendations = data.recommendations.map((r: any) => ({
                ...r,
                title: r.title,
                desc: r.message,
                type: r.urgency_level || 'info',
                color: r.urgency_level === 'critical' ? 'bg-rose-600/20' : 'bg-white/10',
                icon: r.urgency_level === 'critical' ? 'alert-triangle' : 'lightbulb',
                amount: null // Placeholder if not in DB
            }));

            this.categoryBudgets = data.budgets || {};
            this.totalIncome = data.totalIncome || 0;
            console.log("State synchronized and enriched.");
        } catch (error) {
            console.error("Error refreshing state:", error);
        }
    },

    mapColorToBg(hex: string) {
        if (hex === '#10b981') return 'bg-emerald-100';
        if (hex === '#f43f5e') return 'bg-rose-100';
        if (hex === '#0ea5e9') return 'bg-sky-100';
        if (hex === '#6366f1') return 'bg-indigo-100';
        if (hex === '#d946ef') return 'bg-fuchsia-100';
        if (hex === '#f59e0b') return 'bg-amber-100';
        return 'bg-slate-100';
    },

    mapColorToText(hex: string) {
        if (hex === '#10b981') return 'text-emerald-600';
        if (hex === '#f43f5e') return 'text-rose-600';
        if (hex === '#0ea5e9') return 'text-sky-600';
        if (hex === '#6366f1') return 'text-indigo-600';
        if (hex === '#d946ef') return 'text-fuchsia-600';
        if (hex === '#f59e0b') return 'text-amber-600';
        return 'text-slate-600';
    },

    async updateRecommendation(id: number, status: string) {
        try {
            await api.updateRecommendationStatus(id, status);
            // Locally update the status
            const rec = this.recommendations.find(r => r.id === id);
            if (rec) {
                rec.status = status;
            }
            console.log(`Recommendation ${id} updated to ${status}`);
        } catch (error) {
            console.error("Error updating recommendation:", error);
        }
    },

    async resetChat() {
        try {
            await api.resetChat();
            this.messages = [
                { id: 1, sender: 'buddy', text: "Hi! I'm Wais Wallet AI pilot, your strategic financial co-pilot. How can I assist you in optimizing your finances today?", feedback: null }
            ];
            console.log("Chat session reset.");
        } catch (error) {
            console.error("Error resetting chat:", error);
        }
    }
};

export const COUNTRIES = ['Philippines', 'United States', 'Japan', 'United Kingdom', 'Australia', 'Canada', 'Singapore'];
export const CURRENCIES = {
    'PHP': '₱',
    'USD': '$',
    'EUR': '€',
    'JPY': '¥',
    'GBP': '£',
    'AUD': 'A$',
    'CAD': 'C$',
    'SGD': 'S$'
};
