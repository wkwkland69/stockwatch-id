// Dummy Data
const stockData = [
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

// Top Gainers & Losers Data
const topGainers = [
    { symbol: "ADRO", change_percent: 3.07 },
    { symbol: "BMRI", change_percent: 2.15 },
    { symbol: "BBCA", change_percent: 1.25 },
    { symbol: "TLKM", change_percent: 0.78 },
    { symbol: "UNVR", change_percent: 0.62 }
];

const topLosers = [
    { symbol: "PGAS", change_percent: -2.68 },
    { symbol: "ASII", change_percent: -1.18 },
    { symbol: "BBRI", change_percent: -0.49 }
];

// DOM Elements
const watchlistContainer = document.getElementById('watchlistContainer');
const topGainersContainer = document.getElementById('topGainers');
const topLosersContainer = document.getElementById('topLosers');
const signalPanel = document.getElementById('signalPanel');
const searchInput = document.getElementById('searchInput');
const sectorFilter = document.getElementById('sectorFilter');
const volumeFilter = document.getElementById('volumeFilter');
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdate = document.getElementById('lastUpdate');
const stockModal = document.getElementById('stockModal');
const closeModal = document.getElementById('closeModal');

// Global Variables
let currentFilter = 'all';
let currentVolumeFilter = 'all';
let searchTerm = '';
let detailChart = null;
let autoRefreshInterval = null;

// Format Number Functions
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

// Render Functions
function renderStockCard(stock) {
    const changeColor = stock.change_percent >= 0 ? 'text-green-500' : 'text-red-500';
    const changeIcon = stock.change_percent >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    
    return `
        <div class="stock-card bg-slate-800 rounded-xl p-4 cursor-pointer" data-symbol="${stock.symbol}">
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
                <div class="flex items-center space-x-4">
                    <div>
                        <p class="text-slate-400">Volume</p>
                        <p class="text-white font-medium">${formatVolume(stock.volume)}</p>
                    </div>
                    <div>
                        <p class="text-slate-400">Market Cap</p>
                        <p class="text-white font-medium">${formatMarketCap(stock.market_cap)}</p>
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

function renderTopGainers() {
    topGainersContainer.innerHTML = topGainers.map(gainer => `
        <div class="flex items-center justify-between">
            <span class="font-medium text-white">${gainer.symbol}</span>
            <span class="text-green-500 font-medium">
                +${gainer.change_percent.toFixed(2)}%
            </span>
        </div>
    `).join('');
}

function renderTopLosers() {
    topLosersContainer.innerHTML = topLosers.map(loser => `
        <div class="flex items-center justify-between">
            <span class="font-medium text-white">${loser.symbol}</span>
            <span class="text-red-500 font-medium">
                ${loser.change_percent.toFixed(2)}%
            </span>
        </div>
    `).join('');
}

function renderSignalPanel() {
    // Get top 3 signals
    const signals = stockData
        .filter(stock => stock.recommendation !== 'hold')
        .sort((a, b) => {
            const priority = { 'buy': 3, 'sell': 2, 'hold': 1 };
            return priority[b.recommendation] - priority[a.recommendation];
        })
        .slice(0, 3);
    
    signalPanel.innerHTML = signals.map(stock => `
        <div class="bg-slate-900 p-4 rounded-lg">
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

// Helper Functions
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

function filterStocks() {
    let filtered = [...stockData];
    
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
            stock.name.toLowerCase().includes(term)
        );
    }
    
    return filtered;
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

// Modal Functions
function openStockModal(stock) {
    // Update modal content
    document.getElementById('modalStockSymbol').textContent = stock.symbol;
    document.getElementById('modalStockName').textContent = stock.name;
    document.getElementById('modalStockPrice').textContent = formatNumber(stock.price);
    document.getElementById('modalStockChange').innerHTML = `
        <span class="${stock.change_percent >= 0 ? 'text-green-500' : 'text-red-500'} font-medium">
            ${stock.change_percent >= 0 ? '+' : ''}${stock.change_percent.toFixed(2)}%
        </span>
        <span class="text-slate-400 ml-2">${stock.change >= 0 ? '+' : ''}${stock.change}</span>
    `;
    document.getElementById('modalRSI').textContent = stock.rsi;
    document.getElementById('modalMACD').textContent = '12.5';
    
    // Render detail chart
    renderDetailChart(stock);
    
    // Show modal
    stockModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function renderDetailChart(stock) {
    const ctx = document.getElementById('detailChart').getContext('2d');
    
    // Destroy previous chart if exists
    if (detailChart) {
        detailChart.destroy();
    }
    
    // Generate dummy candlestick data
    const candlestickData = [];
    const labels = [];
    for (let i = 0; i < 20; i++) {
        const open = stock.price * (0.95 + Math.random() * 0.1);
        const close = open * (0.98 + Math.random() * 0.04);
        const high = Math.max(open, close) * (1 + Math.random() * 0.02);
        const low = Math.min(open, close) * (0.98 - Math.random() * 0.02);
        
        candlestickData.push({ open, high, low, close });
        labels.push(`H-${20-i}`);
    }
    
    // Generate MA20 and MA50 data
    const ma20 = [];
    const ma50 = [];
    for (let