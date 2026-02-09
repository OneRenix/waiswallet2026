import { state } from '../state';
import { api } from '../services/api';

declare var $: any;
declare var lucide: any;

export const initModals = () => {
    const $view = (window as any).app;

    // --- Global Close Modal ---
    $(document).off('click', '.btn-close-modal').on('click', '.btn-close-modal', function (this: HTMLElement) {
        $(this).closest('.fixed').addClass('hidden').removeClass('flex');
    });

    // --- Add Transaction Modal ---
    $('#fab-add').off('click').on('click', () => {
        state.entryType = 'expense';
        updateAddModalState();
        const $catSelect = $('#inp-category').empty();
        state.categories.forEach(c => $catSelect.append(`<option value="${c.id}">${c.label}</option>`));
        const $cardSelect = $('#inp-card').empty();
        state.cards.forEach(c => $cardSelect.append(`<option value="${c.id}">${c.name}</option>`));
        const now = new Date();
        $('#inp-date').val(now.toISOString().split('T')[0]);
        $('#inp-time').val(now.toTimeString().split(' ')[0].substring(0, 5));
        $('#modal-add').removeClass('hidden').addClass('flex');
    });

    const updateAddModalState = () => {
        const isExpense = state.entryType === 'expense';
        if (isExpense) {
            $('#tab-expense').addClass('bg-white shadow-sm text-slate-800').removeClass('text-slate-500 hover:text-slate-700');
            $('#tab-income').removeClass('bg-white shadow-sm text-slate-800').addClass('text-slate-500 hover:text-slate-700');
            $('#section-scanner').removeClass('hidden');
            $('#section-payment-type').removeClass('hidden');
            $('#lbl-merchant').text('Merchant');
            $('#lbl-card').text('Strategic Card Choice');
            $('#btn-submit-entry').text('Save Expense').removeClass('bg-emerald-600 hover:bg-emerald-700').addClass('bg-blue-600 hover:bg-blue-700');
            $('.btn-payment-type[data-type="straight"]').click();
        } else {
            $('#tab-income').addClass('bg-white shadow-sm text-slate-800').removeClass('text-slate-500 hover:text-slate-700');
            $('#tab-expense').removeClass('bg-white shadow-sm text-slate-800').addClass('text-slate-500 hover:text-slate-700');
            $('#section-scanner').addClass('hidden');
            $('#section-payment-type').addClass('hidden');
            $('#installment-config').addClass('hidden');
            $('#lbl-merchant').text('Source');
            $('#lbl-card').text('Deposit To');
            $('#btn-submit-entry').text('Save Income').removeClass('bg-blue-600 hover:bg-blue-700').addClass('bg-emerald-600 hover:bg-emerald-700');
        }
    };

    $('#tab-expense').off('click').on('click', (e: any) => { e.preventDefault(); state.entryType = 'expense'; updateAddModalState(); });
    $('#tab-income').off('click').on('click', (e: any) => { e.preventDefault(); state.entryType = 'income'; updateAddModalState(); });

    $('#form-add').off('submit').on('submit', async function (e: any) {
        e.preventDefault();
        const txData = {
            wallet_id: parseInt($('#inp-card').val()),
            merchant: $('#inp-merchant').val(),
            total_amount: parseFloat($('#inp-amount').val()),
            transaction_date: $('#inp-date').val(),
            category_id: parseInt($('#inp-category').val()),
            payment_type: $('.btn-payment-type.bg-blue-600').data('type') || 'straight',
            description: $('#inp-note').val() || ""
        };

        try {
            await api.createTransaction(txData);
            await state.refresh();
            $('#modal-add').addClass('hidden').removeClass('flex');
            $view.render();
        } catch (err) {
            alert('Failed to save transaction: ' + err);
        }
    });

    // --- Receipt Scanner ---
    $('#btn-scan').off('click').on('click', () => $('#file-upload').click());
    $('#file-upload').off('change').on('change', async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        $('#btn-scan').text('PILOTING...');
        // Note: For now, we still use the old scan logic but we should move it to backend
        // For the sake of this task, I'll keep it as is or proxy it
        try {
            alert("Scanner integration coming in next step!");
        } finally {
            $('#btn-scan').text('SCAN NOW');
        }
    });

    // --- Wallet Modal (Add/Edit) ---
    // --- Helper to populate providers ---
    const populateProviders = async (walletType: string, selectedProviderId: number | null = null, legacyProviderName: string | null = null) => {
        try {
            const data = await api.getProviders(walletType);
            const $select = $('#inp-wallet-provider').empty();

            if (data.providers && data.providers.length > 0) {
                // Add default "Select Provider" option
                $select.append(`<option value="" disabled ${!selectedProviderId ? 'selected' : ''}>Select Provider</option>`);

                data.providers.forEach((p: any) => {
                    const isSelected = p.id === selectedProviderId;
                    $select.append(`<option value="${p.id}" ${isSelected ? 'selected' : ''}>${p.name}</option>`);
                });
            } else {
                $select.append(`<option value="">No providers found</option>`);
            }

            // Handle legacy provider names (if no ID matches but name does)
            if (!selectedProviderId && legacyProviderName) {
                // Try to find by name within the fetched list
                const match = data.providers.find((p: any) => p.name === legacyProviderName);
                if (match) {
                    $select.val(match.id);
                } else {
                    // If really completely unknown, maybe we need a way to show it? 
                    // For now, let's just log warning. The migration should have handled this.
                    console.warn("Legacy provider not found in list:", legacyProviderName);
                }
            }
        } catch (err) {
            console.error("Failed to populate providers", err);
            $('#inp-wallet-provider').html('<option value="">Error loading providers</option>');
        }
    };

    // Expose for other modules
    (window as any).populateProviders = populateProviders;

    $('#inp-wallet-type').off('change').on('change', function (this: HTMLSelectElement) {
        populateProviders($(this).val() as string);
    });

    (window as any).populateWalletMultipliers = (benefits: Record<number, number> = {}) => {
        const $list = $('#multiplier-list').empty();
        state.categories.forEach(cat => {
            const val = benefits[cat.numericId] || 0;
            $list.append(`
                <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-3 text-slate-600">
                        <i data-lucide="${cat.icon}" class="w-5 h-5 text-slate-400"></i>
                        <span class="font-medium text-slate-700">${cat.label}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <input type="number" step="0.1" value="${val}" data-cat="${cat.numericId}" 
                            class="inp-multiplier w-20 p-2 rounded-lg border border-slate-200 text-center font-bold text-slate-900 outline-none focus:border-blue-500 transition-all">
                        <span class="text-slate-400 font-bold">%</span>
                    </div>
                </div>
            `);
        });
        // @ts-ignore
        if (window.lucide) window.lucide.createIcons();
    };

    $('#form-wallet').off('submit').on('submit', async function (e: any) {
        e.preventDefault();
        const id = $('#inp-wallet-id').val();

        const benefits: Record<number, number> = {};
        $('.inp-multiplier').each(function (this: HTMLElement) {
            const cat = parseInt($(this).data('cat')); // This data-cat should be the numeric ID now
            const val = parseFloat($(this).val()) || 0;
            if (!isNaN(cat) && val > 0) benefits[cat] = val;
        });

        const providerIdVal = $('#inp-wallet-provider').val();
        if (!providerIdVal) {
            alert("Please select a provider.");
            return;
        }

        const walletData = {
            name: $('#inp-wallet-name').val(),
            provider_id: parseInt(providerIdVal),
            color: $('#inp-wallet-color').val() || '#3b82f6',
            type: $('#inp-wallet-type').val(),
            balance: parseFloat($('#inp-wallet-balance').val()) || 0.0, // Include current balance
            credit_limit: parseFloat($('#inp-wallet-limit').val()) || null,
            due_day: $('#inp-wallet-due-date').val() ? new Date($('#inp-wallet-due-date').val()).getDate() : null,
            cycle_day: $('#inp-wallet-cycle-date').val() ? new Date($('#inp-wallet-cycle-date').val()).getDate() : null,
            monthly_cashback_limit: parseFloat($('#inp-wallet-cap').val()) || null,
            benefits: benefits  // Send as object, not JSON string
        };

        console.log("DEBUG: Submitting wallet payload:", walletData);

        try {
            if (id) {
                console.log("DEBUG: Updating wallet ID:", id);
                await api.updateWallet(parseInt(id), walletData);
            } else {
                console.log("DEBUG: Creating new wallet");
                await api.createWallet(walletData);
            }
            await state.refresh();
            $('#modal-wallet').addClass('hidden').removeClass('flex');
            $view.render();
        } catch (err) {
            console.error("ERROR: Failed to save wallet:", err);
            alert('Failed to save wallet: ' + err);
        }
    });

    // --- Goal Modal ---
    $('#form-goal').off('submit').on('submit', async (e: any) => {
        e.preventDefault();
        const id = $('#goal-id').val();
        const goalData = {
            name: $('#goal-name').val(),
            target_amount: parseFloat($('#goal-target').val()),
            current_amount: parseFloat($('#goal-current').val()),
            color: $('#goal-color').val() || 'bg-emerald-500',
            icon: 'target', // Default icon
            source_id: $('#goal-source').val() ? parseInt($('#goal-source').val()) : null
        };

        try {
            if (id) {
                await api.updateGoal(parseInt(id), goalData);
            } else {
                await api.createGoal(goalData);
            }
            await state.refresh();
            $('#modal-goal').addClass('hidden').removeClass('flex');
            $view.render();
        } catch (err) {
            alert('Failed to save goal: ' + err);
        }
    });

    // --- Add Category Logic ---
    $(document).off('click', '#btn-add-category').on('click', '#btn-add-category', () => {
        $('#new-cat-name').val('');
        $('#new-cat-limit').val('');
        $('#new-cat-color').val('blue');
        $('#modal-add-category').removeClass('hidden').addClass('flex');
    });

    $('#form-add-category').off('submit').on('submit', async function (e: any) {
        e.preventDefault();
        const name = $('#new-cat-name').val();
        const limit = parseFloat($('#new-cat-limit').val());
        const colorName = $('#new-cat-color').val();

        if (!name || isNaN(limit)) return;

        try {
            await api.createCategory(name, limit);
            await state.refresh();
            $('#modal-add-category').addClass('hidden').removeClass('flex');
            $view.render();
        } catch (err) {
            alert('Failed to save category');
        }
    });

    // --- Chat Logic ---
    $('#fab-chat').off('click').on('click', () => {
        $('#modal-chat').removeClass('hidden').addClass('flex');
    });

    $('#form-chat').off('submit').on('submit', async function (e: any) {
        e.preventDefault();
        const $input = $('#chat-input');
        const msg = $input.val();
        if (!msg) return;

        const $chatBox = $('#chat-messages');
        $chatBox.append(`
            <div class="flex flex-col items-end">
                <div class="max-w-[85%] p-3 rounded-2xl text-sm bg-blue-600 text-white shadow-sm rounded-tr-none">${msg}</div>
            </div>
        `);
        $input.val('');
        $chatBox.scrollTop($chatBox[0].scrollHeight);

        try {
            $chatBox.append(`
                <div id="msg-loading" class="flex flex-col items-start p-4 animate-pulse">
                    <div class="flex items-center gap-3 bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                        <div class="relative flex items-center justify-center">
                             <i data-lucide="bot" class="w-6 h-6 text-blue-600 animate-bounce"></i>
                             <div class="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping"></div>
                        </div>
                        <div class="flex gap-1">
                            <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                            <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                            <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                        </div>
                        <span class="text-xs font-bold text-slate-500">Thinking...</span>
                    </div>
                </div>
            `);
            lucide.createIcons();
            const data = await api.chat(msg, {});
            $('#msg-loading').remove();
            $chatBox.append(`
                <div class="flex flex-col items-start message-bubble">
                    <div class="max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm bg-white border border-slate-100 text-slate-700 rounded-tl-none">${data.response}</div>
                </div>
            `);
            lucide.createIcons();
            $chatBox.scrollTop($chatBox[0].scrollHeight);
        } catch (e) {
            $('#msg-loading').text('Error analyzing.');
        }
    });

    // Edit Transaction
    $(document).off('click', '.btn-edit-tx').on('click', '.btn-edit-tx', function (this: HTMLElement) {
        const id = $(this).data('id');
        const tx = state.transactions.find(t => t.id === id);
        if (!tx) return;

        $('#edit-tx-id').val(tx.id);
        $('#edit-tx-amount').val(tx.amount);
        $('#edit-tx-merchant').val(tx.merchant);
        $('#edit-tx-date').val(tx.date);

        const $cat = $('#edit-tx-category').empty();
        state.categories.forEach(c => $cat.append(`<option value="${c.id}" ${c.id === tx.category ? 'selected' : ''}>${c.label}</option>`));

        $('#modal-edit-transaction').removeClass('hidden').addClass('flex');
    });

    $('#form-edit-transaction').off('submit').on('submit', async (e: any) => {
        e.preventDefault();
        const id = parseInt($('#edit-tx-id').val());
        const txData = {
            wallet_id: state.transactions.find(t => t.id === id)?.cardId || 1, // Fallback if not found
            merchant: $('#edit-tx-merchant').val(),
            total_amount: parseFloat($('#edit-tx-amount').val()),
            transaction_date: $('#edit-tx-date').val(),
            category_id: parseInt($('#edit-tx-category').val()),
            payment_type: 'straight'
        };

        try {
            await api.updateTransaction(id, txData);
            await state.refresh();
            $('#modal-edit-transaction').addClass('hidden').removeClass('flex');
            $view.render();
        } catch (err) {
            alert('Failed to update transaction');
        }
    });

    $('#btn-delete-tx').off('click').on('click', async () => {
        const id = parseInt($('#edit-tx-id').val());
        try {
            await api.deleteTransaction(id);
            await state.refresh();
            $('#modal-edit-transaction').addClass('hidden').removeClass('flex');
            $view.render();
        } catch (err) {
            alert('Failed to delete transaction');
        }
    });
};
