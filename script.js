// Configuration
const CONFIG = {
    ALPHA_VANTAGE_API_KEY: 'MZWY6UFT09K65WG4',
    REFRESH_INTERVAL: 30000, // 30 seconds
    LQ45_STOCKS: ['BBCA', 'BBRI', 'TLKM', 'ASII', 'BMRI', 'UNVI', 'PGAS', 'ADRO']
};

// State Management
let appState = {
    stocks: [],
    lastUpdate: null,
    isLoading: true,
    error: null
};

// DOM Elements
const watchlistContainer = document.getElementById('watchlistContainer');
const topGainersContainer = document.getElementById('topGainers');
const topLosersContainer = document.getElementById('topLosers');
const signalPanel = document.getElementById('signalPanel');
const searchInput = document.getElementById('searchInput');
const sectorFilter = document.getElementById('sectorFilter');
const volumeFilter = document.getElementById('volumeFilter');
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdateEl = document.getElementById('lastUpdate');
const stockModal = document.getElementById('stockModal');
const closeModal = document.getElementById('closeModal');

// API Functions
async function fetchStockData(symbol) {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}.JK&apikey=${CONFIG.ALPHA_VANTAGE_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data['Global Quote']) {
            const quote = data['Global Quote'];
            return {
                symbol: symbol,
                price: parseFloat(quote['05. price']),
                change: parseFloat(quote['09. change']),
                change_percent: parseFloat(quote['10. change percent'].replace('%', '')),
                volume: parseInt(quote['06. volume']),
                open: parseFloat(quote['02. open']),
                high: parseFloat(quote['03. high']),
                low: parseFloat(quote['04. low']),
                previous_close: parseFloat(quote['08. previous close'])
            };
        } else {
            console.warn(`No data for ${symbol}`);
            return generateDummyData(symbol);
        }
    } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        return generateDummyData(symbol);
    }
}

function generateDummyData(symbol) {
    // Fallback dummy data if API fails
    const basePrice = Math.random() * 10000 + 1000;
    const changePercent = (Math.random() * 10) - 5;
    const change = basePrice * (changePercent / 100);
    
    return {
        symbol: symbol,
        price: Math.round(basePrice),
        change: Math.round(change),
        change_percent: parseFloat(changePercent.toFixed(2)),
        volume: Math.floor(Math.random() * 100000000) + 10000000,
        open: Math.round(basePrice * (1 - Math.random() * 0.05)),
        high: Math.round(basePrice * (1 + Math.random() * 0.05)),
        low: Math.round(basePrice * (1 - Math.random() * 0.05)),
        previous_close: Math.round(basePrice * (1 - Math.random() * 0.02))
    };
}

async function fetchAllStocks() {
    appState.isLoading = true;
    renderLoadingState();
    
    const promises = CONFIG.LQ45_STOCKS.map(symbol => fetchStockData(symbol));
    const results = await Promise.allSettled(promises);
    
    const stocks = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(stock => stock !== null);
    
    // Calculate technical indicators
    stocks.forEach(stock => {
        stock.rsi = calculateRSI(stock);
        stock.trend = determineTrend(stock);
        stock.recommendation = generateRecommendation(stock);
        stock.sector = getSector(stock.symbol);
        stock.sparkline = generateSparkline(stock);
    });
    
    appState.stocks = stocks;
    appState.lastUpdate = new Date();
    appState.isLoading = false;
    appState.error = null;
    
    updateUI();
}

// Technical Analysis Functions
function calculateRSI(stock) {
    // Simplified RSI calculation
    const avgGain = Math.max(stock.change, 0);
    const avgLoss = Math.abs(Math.min(stock.change, 0));
    
    if (avgLoss === 0) return 100;
    if (avgGain === 0) return 0;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    return Math.round(rsi);
}

function determineTrend(stock) {
    if (stock.change_percent > 1) return 'bullish';
    if (stock.change_percent < -1) return 'bearish';
    return 'neutral';
}

function generateRecommendation(stock) {
    if (stock.rsi < 30 && stock.change_percent > 0) return 'buy';
    if (stock.rsi > 70 && stock.change_percent < 0) return 'sell';
    return 'hold';
}

function getSector(symbol) {
    const sectorMap = {
        'BBCA': 'finance',
        'BBRI': 'finance',
        'BMRI': 'finance',
        'TLKM': 'infrastructure',
        'ASII': 'consumer',
        'UNVI': 'consumer',
        'PGAS': 'energy',
        'ADRO': 'energy'
    };
    return sectorMap[symbol] || 'other';
}

function generateSparkline(stock) {
    // Generate random sparkline data based on price movement
    const points = 8;
    const sparkline = [];
    let current = stock.price;
    
    for (let i = 0; i < points; i++) {
        const fluctuation = (Math.random() * 0.04) - 0.02; // -2% to +2%
        current = current * (1 + fluctuation);
        sparkline.push(Math.round(current));
    }
    
    return sparkline;
}

// UI Rendering Functions
function renderLoadingState() {
    watchlistContainer.innerHTML = `
        <div class="col-span-2 space-y-4">
            ${Array(4).fill().map(() => `
                <div class="skeleton h-32 rounded-xl"></div>
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
        watchlistContainer.innerHTML = `
            <div class="col-span-2 text-center py-12">
                <i class="fas fa-search text-4xl text-slate-600 mb-4"></i>
                <p class="text-slate-400">Tidak ada saham yang sesuai dengan filter</p>
            </div>
        `;
        return;
    }
    
    watchlistContainer.innerHTML = filteredStocks.map(renderStockCard).join('');
    
    // Render sparkline charts
    filteredStocks.forEach(stock => {
        const canvas = document.getElementById(`sparkline-${stock.symbol}`);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            new Chart(ctx, {
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
    
    return `
        <div class="stock-card bg-slate-800 rounded-xl p-4 cursor-pointer fade-in" data-symbol="${stock.symbol}">
            <div class="flex items-center justify-between mb-3">
                <div>
                    <h3 class="font-bold text-lg text-white">${stock.symbol}</h3>
                    <p class="text-sm text-slate-400">${getCompanyName(stock.symbol)}</p>
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
                <div class="flex items-center space-x-4">
                    <div>
                        <p class="text-slate-400">Volume</p>
                        <p class="text-white font-medium">${formatVolume(stock.volume)}</p>
                    </div>
                    <div>
                        <p class="text-slate-400">Market Cap</p>
                        <p class="text-white font-medium">${formatMarketCap(stock.price * stock.volume)}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-slate-400">RSI</p>
                    <p class="font-medium ${getRSIColor(stock.rsi)}">${stock.rsi}</p>
                </div>
            </div>
            
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <span class="px-2 py-1 text-xs rounded ${getTrendClass(stock.trend)}">
                        ${stock.trend}
                    </span>
                    <span class="px-2 py-1 text-xs rounded ${getRecommendationClass(stock.recommendation)}">
                        ${stock.recommendation.toUpperCase()}
                    </span>
                </div>
                <div class="sparkline-container">
                    <canvas id="sparkline-${stock.symbol}" width="80" height="40"></canvas>
                </div>
            </div>
        </div>
    `;
}

function renderTopGainersLosers() {
    const sortedStocks = [...appState.stocks].sort((a, b) => b.change_percent - a.change_percent);
    const gainers = sortedStocks.slice(0, 5);
    const losers = sortedStocks.slice(-5).reverse();
    
    topGainersContainer.innerHTML = gainers.map(stock => `
        <div class="flex items-center justify-between">
            <span class="font-medium text-white">${stock.symbol}</span>
            <span class="text-green-500 font-medium">
                +${stock.change_percent.toFixed(2)}%
            </span>
        </div>
    `).join('');
    
    topLosersContainer.innerHTML = losers.map(stock => `
        <div class="flex items-center justify-between">
            <span class="font-medium text-white">${stock.symbol}</span>
            <span class="text-red-500 font-medium">
                ${stock.change_percent.toFixed(2)}%
            </span>
        </div>
    `).join('');
}

function renderSignalPanel() {
    const signals = [...appState.stocks]
        .filter(stock => stock.recommendation !== 'hold')
        .sort((a, b) => {
            const priority = { 'buy': 3, 'sell': 2, 'hold': 1 };
            return priority[b.recommendation] - priority[a.recommendation];
        })
        .slice(0, 3);
    
    signalPanel.innerHTML = signals.map(stock => `
        <div class="bg-slate-900 p-4 rounded-lg fade-in">
            <div class="flex items-center justify-between mb-2">
                <h4 class="font-bold text-white">${stock.symbol}</h4>
                <span class="px-2 py-1 text-xs rounded ${getRecommendationClass(stock.recommendation)}">
                    ${stock.recommendation.toUpperCase()}
                </span>
            </div>
            <div class="space-y-1">
                <div class="flex justify-between">
                    <span class="text-slate-400">Price</span>
                    <span class="text-white">${formatNumber(stock.price)}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">Change</span>
                    <span class="${stock.change_percent >= 0 ? 'text-green-500' : 'text-red-500'}">
                        ${stock.change_percent >= 0 ? '+' : ''}${stock.change_percent.toFixed(2)}%
                    </span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">RSI</span>
                    <span class="${getRSIColor(stock.rsi)}">${stock.rsi}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">Trend</span>
                    <span class="${getTrendClass(stock.trend).split(' ')[0]}">${stock.trend}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Utility Functions
function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

function formatMarketCap(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    return formatNumber(num);
}

function formatVolume(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    return formatNumber(num);
}

function getRSIColor(rsi) {
    if (rsi >= 70) return 'text-red-500';
    if (rsi <= 30) return 'text-green-500';
    return 'text-yellow-500';
}

function getTrendClass(trend) {
    switch(trend) {
        case 'bullish': return 'bg-green-900/30 text-green-400';
        case 'bearish': return 'bg-red-900/30 text-red-400';
        default: return 'bg-yellow-900/30 text-yellow-400';
    }
}

function getRecommendationClass(recommendation) {
    switch(recommendation) {
        case 'buy': return 'bg-green-900/50 text-green-400';
        case 'sell': return 'bg-red-900/50 text-red-400';
        default: return 'bg-yellow-900/50 text-yellow-400';
    }
}

function getCompanyName(symbol) {
    const names = {
        'BBCA': 'Bank Central Asia',
        'BBRI': 'Bank Rakyat Indonesia',
        'TLKM': 'Telkom Indonesia',
        'ASII': 'Astra International',
        'BMRI': 'Bank Mandiri',
        'UNVI': 'Unilever Indonesia',
        'PGAS': 'Perusahaan Gas Negara',
        'ADRO': 'Adaro Energy'
    };
    return names[symbol] || symbol;
}

function filterStocks() {
    let filtered = [...appState.stocks];
    
    // Apply sector filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(stock => stock.sector === currentFilter);
    }
    
    // Apply volume filter
    if (currentVolumeFilter === 'high') {
        filtered.sort((a, b) => b.volume - a.volume);
    } else if (currentVolumeFilter === 'low') {
        filtered.sort((a, b) => a.volume - b.volume);
    }
    
    // Apply search filter
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(stock => 
            stock.symbol.toLowerCase().includes(term) || 
            getCompanyName(stock.symbol).toLowerCase().includes(term)
        );
    }
    
    return filtered;
}

function updateLastUpdateTime() {
    if (appState.lastUpdate) {
        const timeStr = appState.lastUpdate.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        lastUpdateEl.textContent = `Update: ${timeStr}`;
    }
}

// Event Handlers
function handleSearch() {
    searchTerm = searchInput.value.trim();
    renderWatchlist();
}

function handleSectorFilter() {
    currentFilter = sectorFilter.value;
    renderWatchlist();
}

function handleVolumeFilter() {
    currentVolumeFilter = volumeFilter.value;
    renderWatchlist