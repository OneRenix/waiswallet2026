import { state } from './state';
import { renderDashboard, initDashboard } from './modules/dashboard';
import { renderWallets, initWallets } from './modules/wallets';
import { renderGoals, initGoals } from './modules/goals';
import { renderReports, initReports } from './modules/reports';
import { renderHistory, initHistory } from './modules/history';
import { renderSimulation, initSimulation } from './modules/simulation';
import { renderSettings, initSettings } from './modules/settings';
import { renderRecommendations, initRecommendations } from './modules/recommendations';
import { renderCashback, initCashback } from './modules/cashback';
import { initModals } from './modules/modals';

declare var $: any;
declare var lucide: any;

const app = {
    async init() {
        this.bindGlobalEvents();
        initModals();
        await state.refresh();
        this.switchView(state.currentView as any);
    },

    bindGlobalEvents() {
        // Sidebar Toggle
        $('#btn-menu, #slide-menu-backdrop, #btn-close-menu').off('click').on('click', () => {
            $('#slide-menu').toggleClass('hidden');
        });

        // Navigation
        $('.nav-btn').off('click').on('click', function (this: HTMLElement) {
            const view = $(this).data('view');
            app.switchView(view);
            $('#slide-menu').addClass('hidden');
        });
    },

    switchView(view: 'dashboard' | 'wallets' | 'reports' | 'goals' | 'history' | 'simulation' | 'settings' | 'recommendations' | 'cashback') {
        state.currentView = view;
        this.render();
    },

    render() {
        const $container = $('#main-container');
        let html = '';

        switch (state.currentView) {
            case 'dashboard': html = renderDashboard(); break;
            case 'wallets': html = renderWallets(); break;
            case 'goals': html = renderGoals(); break;
            case 'reports': html = renderReports(); break;
            case 'history': html = renderHistory(); break;
            case 'simulation': html = renderSimulation(); break;
            case 'settings': html = renderSettings(); break;
            case 'recommendations': html = renderRecommendations(); break;
            case 'cashback': html = renderCashback(); break;
            default: html = renderDashboard();
        }

        $container.html(html);

        // Initialize Module-specific events
        switch (state.currentView) {
            case 'dashboard': initDashboard(); break;
            case 'wallets': initWallets(); break;
            case 'goals': initGoals(); break;
            case 'reports': initReports(); break;
            case 'history': initHistory(); break;
            case 'simulation': initSimulation(); break;
            case 'settings': initSettings(); break;
            case 'recommendations': initRecommendations(); break;
            case 'cashback': initCashback(); break;
        }

        // Recreate Lucide Icons
        lucide.createIcons();
    }
};

(window as any).app = app;

$(document).ready(() => {
    app.init();
});
