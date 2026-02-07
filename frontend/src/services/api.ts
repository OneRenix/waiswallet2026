const API_BASE = "http://localhost:8000"; // FastAPI default

export const api = {
    async getState() {
        const res = await fetch(`${API_BASE}/api/state`);
        if (!res.ok) throw new Error("Failed to fetch state");
        return res.json();
    },

    async createTransaction(txData: any) {
        const res = await fetch(`${API_BASE}/api/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(txData)
        });
        if (!res.ok) throw new Error("Failed to save transaction");
        return res.json();
    },

    async createWallet(walletData: any) {
        const res = await fetch(`${API_BASE}/api/wallets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(walletData)
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to save wallet: ${res.status} ${errorText}`);
        }
        return res.json();
    },

    async updateWallet(walletId: number, walletData: any) {
        const res = await fetch(`${API_BASE}/api/wallets/${walletId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(walletData)
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to update wallet: ${res.status} ${errorText}`);
        }
        return res.json();
    },

    async createGoal(goalData: any) {
        const res = await fetch(`${API_BASE}/api/goals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(goalData)
        });
        if (!res.ok) throw new Error("Failed to save goal");
        return res.json();
    },

    async updateTransaction(txId: number, txData: any) {
        const res = await fetch(`${API_BASE}/api/transactions/${txId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(txData)
        });
        if (!res.ok) throw new Error("Failed to update transaction");
        return res.json();
    },

    async deleteTransaction(txId: number) {
        const res = await fetch(`${API_BASE}/api/transactions/${txId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to delete transaction");
        return res.json();
    },

    async createCategory(name: string, limit: number) {
        const res = await fetch(`${API_BASE}/api/categories?name=${encodeURIComponent(name)}&limit=${limit}`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error("Failed to create category");
        return res.json();
    },

    async chat(query: string, context: any) {
        const res = await fetch(`${API_BASE}/chat/?query=${encodeURIComponent(query)}`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error("Chat failed");
        return res.json();
    },

    async updateRecommendationStatus(id: number, status: string) {
        const res = await fetch(`${API_BASE}/api/recommendations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error("Failed to update recommendation status");
        return res.json();
    },

    async getProviders(walletType?: string) {
        let url = `${API_BASE}/api/providers`;
        if (walletType) {
            url += `?wallet_type=${encodeURIComponent(walletType)}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch providers");
        return res.json();
    }
};
