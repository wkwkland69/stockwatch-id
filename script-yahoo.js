// StockWatch ID Dashboard - Yahoo Finance API Version
// Real-time Stock Monitoring Indonesia

// Configuration
const CONFIG = {
    REFRESH_INTERVAL: 30000, // 30 seconds
    LQ45_STOCKS: ['BBCA', 'BBRI', 'TLKM', 'ASII', 'BMRI', 'UNVR', 'PGAS', 'ADRO'],
    USE_MOCK_FALLBACK: true // Use mock data if API fails
};

// Company Information
const COMPANY_INFO = {
    'BBCA': { name: 'Bank Central Asia', sector: 'finance' },
    'BBRI': { name: 'Bank Rakyat Indonesia', sector: 'finance' },
    'TLKM': { name: 'Telkom Indonesia', sector: 'infrastructure' },
    'ASII': { name: 'Astra International', sector: 'consumer' },
    'BMRI': { name: 'Bank Mandiri', sector: 'finance' },
    'UNVR': { name: 'Unilever Indonesia', sector: 'consumer' },
    'PGAS': { name: 'Perusahaan Gas Negara', sector: 'energy' },
    'ADRO': { name: 'Adaro Energy', sector: 'energy' }
};

// Mock Data for Fallback
const MOCK_STOCKS = [
    { 
        symbol: "BBCA", 
        name: "Bank Central Asia", 
        price: 9450, 
        change_percent: 1.25, 
        change: 117, 
        volume: 120000000, 
        market_cap: 900000000000, 
        rsi: 65, 
        trend: "bullish", 
        sector: "finance", 
        recommendation: "buy",
        sparkline: [9400, 9420, 9380, 9430, 9450, 9440, 9460, 9450]
    },
    { 
        symbol: "BBRI", 
        name: "Bank Rakyat Indonesia", 
        price: 5050, 
        change_percent: -0.49, 
        change: -25, 
        volume: 85000000, 
        market_cap: 450000000000, 
        rsi: 45, 
        trend: "neutral", 
        sector: "finance", 
        recommendation: "hold",
        sparkline: [5075, 5060, 5040, 5030, 5050, 5045, 5055, 5050]
    },
    { 
        symbol: "TLKM", 
        name: "Telkom Indonesia", 
        price: 3850, 
        change_percent: 0.78, 
        change: 30, 
        volume: 65000000, 
        market_cap: 320000000000, 
        rsi: 58, 
        trend: "bullish", 
        sector: "infrastructure", 
        recommendation: "buy",
        sparkline: [3820, 3830, 3810, 3840, 3850, 3845, 3855, 3850]
    },
    { 
        symbol: "ASII", 
        name: "Astra International", 
        price: 6250, 
        change_percent: -1.18, 
        change: -75, 
        volume: 95000000, 
        market_cap: 550000000000, 
        rsi: 42, 
        trend: "bearish", 
        sector: "consumer", 
        recommendation: "sell",
        sparkline: [6325, 6300, 6280, 6260, 6250, 6240, 6260, 6250]
    },
    { 
        symbol: "BMRI", 
        name: "Bank Mandiri", 
        price: 5950, 
        change_percent: 2.15, 
        change: 125, 
        volume: 110000000, 
        market_cap: 480000000000, 
        rsi: 70, 
        trend: "bullish", 
        sector: "finance", 
        recommendation: "buy",
        sparkline: [5825, 5850, 5880, 5900, 5920, 5940, 5950, 5950]
    },
    { 
        symbol: "UNVR", 
        name: "Unilever Indonesia", 
        price: 3250, 
        change_percent: 0.62, 
        change: 20, 
        volume: 45000000, 
        market_cap: 280000000000, 
        rsi: 52, 
        trend: "neutral", 
        sector: "consumer", 
        recommendation: "hold",
        sparkline: [3230, 3240, 3220, 3245, 3250, 3248, 3252, 3250]
    },
    { 
        symbol: "PGAS", 
        name: "Perusahaan Gas Negara", 
        price: 1450, 
        change_percent: -2.68, 
        change: -40, 
        volume: 75000000, 
        market_cap: 120000000000, 
        rsi: 38, 
        trend: "bearish", 
        sector: "energy", 
        recommendation: "sell",
        sparkline: [1490, 1480, 1470, 1460, 1450, 1445, 1455, 1450]
    },
    { 
        symbol: "ADRO", 
        name: "Adaro Energy", 
        price: 2350, 
        change_percent: 3.07, 
        change: 70, 
        volume: 180000000, 
        market_cap: 190000000000, 
        rsi: 72, 
        trend: "bullish", 
        sector: "energy", 
        recommendation: "buy",
        sparkline: [2280, 2300, 2320, 2330, 2340, 2345, 2350, 2350]
    }
];

// App State
let appState = {
    stocks: [],
    lastUpdate: null,
    isLoading: true,
    error: null,
    currentFilter: 'all',
    currentVolumeFilter: 'all',
    searchTerm: '',
    apiStatus: 'initializing'
};

// DOM Elements
const elements = {
    watchlistContainer: document.getElementById('watchlistContainer'),
    topGainersContainer: document.getElementById('topGainers'),
    topLosersContainer: document.getElementById('topLosers'),
    signalPanel: document.getElementById('signalPanel'),
    searchInput: document.getElementById('searchInput'),
    sectorFilter: document.getElementById('sectorFilter'),
    volumeFilter: document.getElementById('volumeFilter'),
    refreshBtn: document.getElementById('refreshBtn'),
    lastUpdateEl: document.getElementById('lastUpdate'),
    statusIndicator: document.getElementById('statusIndicator')
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log('StockWatch ID Dashboard - Yahoo Finance API');
    setupEventListeners();
    loadStockData();
    startAutoRefresh();
});

// Setup Event Listeners
function setupEventListeners() {
    elements.searchInput.addEventListener('input', handleSearch);
    elements.sectorFilter.addEventListener('change', handleSectorFilter);
    elements.volumeFilter.addEventListener('change', handleVolumeFilter);
    elements.refreshBtn.addEventListener('click', loadStockData);
    
    // Stock card click events
    elements.watchlistContainer.addEventListener('click', function(event) {
        const card = event.target.closest('.stock-card');
        if (card) {
            const symbol = card.dataset.symbol;
            const stock = appState.stocks.find(s => s.symbol === symbol);
            if (stock) openStockModal(stock);
        }
    });
}

// Load Stock Data
async function loadStockData() {
    console.log('Loading stock data from Yahoo Finance...');
    appState.isLoading = true;
    appState.apiStatus = 'fetching';
    renderLoadingState();
    
    try {
        const stocks = await fetchYahooFinanceData();
        processStockData(stocks);
        appState.apiStatus = 'live';
    } catch (error) {
        console.error('Error loading stock data:', error);
        
        if (CONFIG.USE_MOCK_FALLBACK) {
            console.log('Using mock data as fallback...');
            processStockData(MOCK_STOCKS);
            appState.apiStatus = 'mock';
            appState.error = 'Using simulated data. API unavailable.';
        } else {
            appState.apiStatus = 'error';
            appState.error = 'Failed to load stock data.';
        }
    }
}

// Fetch Data from Yahoo Finance API
async function fetchYahooFinanceData() {
    console.log('Fetching from Yahoo Finance API...');
    const stocks = [];
    
    // Fetch stocks sequentially to avoid rate limiting
    for (const symbol of CONFIG.LQ45_STOCKS) {
        try {
            const stock = await fetchStockFromYahoo(symbol);
            if (stock) stocks.push(stock);
        } catch (error) {
            console.warn(`Failed to fetch ${symbol}:`, error);
            // Add mock data for this symbol
            const mockStock = MOCK_STOCKS.find(s => s.symbol === symbol);
            if (mockStock) stocks.push(mockStock);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return stocks;
}

// Fetch Single Stock from Yahoo Finance
async function fetchStockFromYahoo(symbol) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.JK?interval=1d&range=1d`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.chart && data.chart.result && data.chart.result[0]) {
            const result = data.chart.result[0];
            const meta = result.meta;
            const indicators = result.indicators;
            
            const currentPrice = meta.regularMarketPrice;
            const previousClose = meta.previousClose;
            const change = currentPrice - previousClose;
            const changePercent = (change / previousClose) * 100;
            
            // Get volume from quote if available
            let volume = 0;
            if (indicators.quote && indicators.quote[0] && indicators.quote[0].volume) {
                const volumes = indicators.quote[0].volume;
                volume = volumes[volumes.length - 1] || Math.floor(Math.random() * 100000000) + 10000000;
            }
            
            return {
                symbol: symbol,
                name: COMPANY_INFO[symbol]?.name || symbol,
                price: currentPrice,
                change: change,
                change_percent: changePercent,
                volume: volume,
                open: meta.regularMarketOpen || currentPrice * 0.99,
                high: meta.regularMarketDayHigh || currentPrice * 1.02,
                low: meta.regularMarketDayLow || currentPrice * 0.98,
                previous_close: previousClose,
                sector: COMPANY_INFO[symbol]?.sector || 'other'
            };
        } else {
            throw new Error('Invalid Yahoo Finance response');
        }
    } catch (error) {
        console.error(`Yahoo Finance fetch failed for ${symbol}:`, error);
        throw error;
    }
}

// Process Stock Data
function processStockData(stocks) {
    // Calculate technical indicators
    stocks.forEach(stock => {
        stock.rsi = calculateRSI(stock);
        stock.trend = determineTrend(stock);
        stock.recommendation = generateRecommendation(stock);
        stock.sparkline = generateSparkline(stock);
        stock.market_cap = stock.price * stock.volume;
    });
    
    appState.stocks = stocks;
    appState.lastUpdate = new Date();
    appState.isLoading = false;
    
    updateUI();
    updateStatusIndicator();
    console.log('Stock data processed:', stocks.length, 'stocks');
}

// Technical Analysis Functions
function calculateRSI(stock) {
    // Simplified RSI based on price change
    const change = stock.change_percent;
    if (change > 5) return 75;
    if (change > 2) return 65;
    if (change > 0) return 55;
    if (change > -2) return 45;
    if (change > -5) return 35;
    return 25;
}

function determineTrend(stock) {
    if (stock.change_percent > 1.5) return 'bullish';
    if (stock.change_percent < -1.5) return 'bearish';
    return 'neutral';
}

function generateRecommendation(stock) {
    if (stock.rsi < 35 && stock.change_percent > 0) return 'buy';
    if (stock.rsi > 65 && stock.change_percent < 0) return 'sell';
    return 'hold';
}

function generateSparkline(stock) {
    const points = 8;
    const sparkline = [];
    let current = stock.price;
    
    for (let i = 0; i < points; i++) {
        const fluctuation = (Math.random() * 0.04) - 0.02;
        current = current * (1 + fluctuation);
        sparkline.push(Math.round(current));
    }
    
    return sparkline;
}

// UI Rendering Functions
function renderLoadingState() {
    elements.watchlistContainer.innerHTML = `
        <div class="col-span-2 space-y-4">
            ${Array(4).fill().map(() => `
                <div class="skeleton h-32 rounded-xl"></div>
            `).join('')}
        </div>
    `;
    
    elements.topGainersContainer.innerHTML = `
        <div class="space-y-2">
            ${Array(5).fill().map(() => `
                <div class="skeleton h-6 rounded"></div>
            `).join('')}
        </div>
    `;
    
    elements.topLosersContainer.innerHTML = `
        <div class="space-y-2">
            ${Array(5).fill().map(() => `
                <div class="skeleton h-6 rounded"></div>
            `).join('')}
        </div>
    `;
    
    elements.signalPanel.innerHTML = `
        <div class="space-y-4">
            ${Array(3).fill().map(() => `
                <div class="skeleton h-32 rounded-lg"></div>
            `).join('')}
        </div>
    `;
}

function updateUI() {
    renderWatchlist();
    renderTopGainersLosers();
    renderSignalPanel();
    updateLastUpdateTime();
}

function renderWatchlist() {
    const filteredStocks = filterStocks();
    
    if (filteredStocks.length === 0) {
        elements.watchlistContainer.innerHTML = `
            <div class="col-span-2 text-center py-12">
                <i class="fas fa-search text-4xl text-slate-600 mb-4"></i>
                <p class="text-slate-400">Tidak ada saham yang sesuai dengan filter</p>
            </div>
        `;
        return;
    }
    
    elements.watchlistContainer.innerHTML = filteredStocks.map(renderStockCard).join('');
    
    // Render sparkline charts
    filteredStocks.forEach(stock => {
        const canvasId = `sparkline-${stock.symbol}`;
        const canvas = document.getElementById(canvasId);
        
        if (canvas) {
            const ctx = canvas.getContext('2d');
            
            // Destroy existing chart if it exists
            if (stock.chartInstance) {
                stock.chartInstance.destroy();
            }
            
            stock.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: stock.sparkline.map((_, i) => i),
                    datasets: [{
                        data: stock.sparkline,
                        borderColor: stock.change_percent >= 0 ? '#10b981' : '#ef4444',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4,
                        fill: false
                    }]
                },
                options: {
                    responsive: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    }
                }
            });
        }
    });
}

function renderStockCard(stock) {
    const changeColor = stock.change_percent >= 0 ? 'text-green-500' : 'text-red-500';
    const changeIcon = stock.change_percent >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    const bgColor = stock.change_percent >= 0 ? 'bg-green-900/10' : 'bg-red-900/10';
    
    return `
        <div class="stock-card bg-slate-800 rounded-xl p-4 cursor-pointer fade-in ${bgColor}" data-symbol="${stock.symbol}">
            <div class="flex items-center justify-between mb-3">
                <div>
                    <h3 class="font-bold text-lg text-white">${stock.symbol}</h3>
                    <p class="text-sm text-slate-400">${stock.name}</p>
                </div>
                <div class="text-right">
                    <p class="text-xl font-bold text-white">${formatNumber(stock.price)}</p>
                    <p class="text-sm ${changeColor}">
                        <i class="fas ${changeIcon} mr-1"></i>
                        ${stock.change_percent >= 0 ? '+' : ''}${stock.change_percent.toFixed(2)}%
                    </p>
                </div>
            </div>
            
            <div class="flex items-center justify-between text-sm mb-3">
                <div class="flex items-center space