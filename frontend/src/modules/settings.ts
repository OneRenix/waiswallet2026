import { state, COUNTRIES, CURRENCIES } from '../state';

declare var $: any;

export const renderSettings = () => {
    return `
    <div class="animate-slide-in max-w-2xl mx-auto">
        <h2 class="text-2xl font-bold flex items-center gap-2 text-slate-900 mb-6">
            <i data-lucide="settings" class="text-blue-600"></i> Settings
        </h2>
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
            <div class="p-4 bg-slate-50 border-b border-slate-100">
                <h3 class="font-bold text-slate-900">General Preferences</h3>
            </div>
            <div class="p-6 space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-bold text-slate-700">Currency</p>
                        <p class="text-xs text-slate-500">Display currency for all values</p>
                    </div>
                    <select id="setting-currency" class="p-2 rounded-lg border border-slate-200 bg-white text-sm outline-none">
                        ${Object.keys(CURRENCIES).map(c => `<option value="${c}" ${state.currency === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-bold text-slate-700">Region Context</p>
                        <p class="text-xs text-slate-500">Adapts advice to local market</p>
                    </div>
                    <select id="setting-country" class="p-2 rounded-lg border border-slate-200 bg-white text-sm outline-none">
                        ${COUNTRIES.map(c => `<option value="${c}" ${state.country === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
            </div>
        </div>
        <div class="text-center text-xs text-slate-400 mt-10">
            WaisWallet v2.0 • Local Storage Mode
        </div>
    </div>`;
};

export const initSettings = () => {
    $(document).off('change', '#setting-currency').on('change', '#setting-currency', function (this: HTMLSelectElement) {
        state.currency = $(this).val();
        // @ts-ignore
        window.app.render();
    });

    $(document).off('change', '#setting-country').on('change', '#setting-country', function (this: HTMLSelectElement) {
        state.country = $(this).val();
        // @ts-ignore
        window.app.render();
    });
};
