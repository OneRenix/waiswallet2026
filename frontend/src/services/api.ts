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

    async updateGoal(goalId: number, goalData: any) {
        const res = await fetch(`${API_BASE}/api/goals/${goalId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(goalData)
        });
        if (!res.ok) throw new Error("Failed to update goal");
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
        // Generate or retrieve session ID (simple client-side ID for now)
        let sessionId = localStorage.getItem('wais_session_id');
        if (!sessionId) {
            sessionId = 'web_' + Math.random().toString(36).substring(2, 10);
            localStorage.setItem('wais_session_id', sessionId);
        }

        const res = await fetch(`${API_BASE}/chat/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: query,
                session_id: sessionId
            })
        });
        if (!res.ok) throw new Error("Chat failed");
        return res.json();
    },

    async resetChat() {
        const sessionId = localStorage.getItem('wais_session_id');
        if (!sessionId) return { status: 'success' };

        const res = await fetch(`${API_BASE}/chat/reset?session_id=${sessionId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to reset chat");

        // Also regenerate session ID to be extra sure
        const newSessionId = 'web_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('wais_session_id', newSessionId);

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
