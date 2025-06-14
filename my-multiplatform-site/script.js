document.addEventListener('DOMContentLoaded', () => {
    // --- DATA SIMULASI ---
    let plants = [
        { id: 1, name: "Selada 1", height: 30, status: "healthy", image: "https://placehold.co/120x120/22c55e/FFFFFF?text=Sehat" },
        { id: 2, name: "Selada 2", height: 25, status: "warning", image: "https://placehold.co/120x120/facc15/000000?text=Layu" },
        { id: 3, name: "Selada 3", height: 45, status: "healthy", image: "https://placehold.co/120x120/16a34a/FFFFFF?text=Sehat" },
        { id: 4, name: "Selada 4", height: 18, status: "critical", image: "https://placehold.co/120x120/ef4444/FFFFFF?text=Kritis" }
    ];

    let sensorData = { temperature: 28.5, humidity: 75, soilMoisture: 65 };
    let actuatorStates = { pump: false, blower: false, lastPumpActivation: null, lastBlowerActivation: null, pumpDurationToday: 0, blowerDurationToday: 0 };
    let notifications = [];

    // --- STATE APLIKASI ---
    let charts = {};
    let activeTabId = 'environment';
    let activeTimeRange = '7d';

    // --- ELEMEN DOM ---
    const elements = {
        currentDatetime: document.getElementById('current-datetime'),
        refreshBtn: document.getElementById('refresh-btn'),
        notificationBell: document.getElementById('notification-bell'),
        notificationCount: document.getElementById('notification-count'),
        notificationCenter: document.getElementById('notification-center'),
        closeNotificationsBtn: document.getElementById('close-notifications'),
        notificationList: document.getElementById('notification-list'),
        plantList: document.getElementById('plant-list'),
        temperatureValue: document.getElementById('temperature-value'),
        humidityValue: document.getElementById('humidity-value'),
        soilMoistureValue: document.getElementById('soil-moisture-value'),
        airStatus: document.getElementById('air-status'),
        soilStatus: document.getElementById('soil-status'),
        pumpToggle: document.getElementById('pumpToggle'),
        pumpStatusText: document.getElementById('pumpStatusText'),
        blowerToggle: document.getElementById('blowerToggle'),
        blowerStatusText: document.getElementById('blowerStatusText'),
        lastPumpActivation: document.getElementById('lastPumpActivation'),
        pumpDurationToday: document.getElementById('pumpDurationToday'),
        lastBlowerActivation: document.getElementById('lastBlowerActivation'),
        blowerDurationToday: document.getElementById('blowerDurationToday'),
        tabNavigation: document.getElementById('tab-navigation'),
        tabContent: document.getElementById('tab-content')
    };
    
    // --- FUNGSI UTILITAS ---
    const getStatusStyles = (status) => {
        const styles = {
            info: { text: 'Info', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: 'fa-info-circle' },
            healthy: { text: 'Sehat', color: 'text-green-400', bg: 'bg-green-500/20', icon: 'fa-check-circle' },
            warning: { text: 'Perhatian', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: 'fa-exclamation-triangle' },
            critical: { text: 'Kritis', color: 'text-red-400', bg: 'bg-red-500/20', icon: 'fa-times-circle' }
        };
        return styles[status] || styles.info;
    };

    const addNotification = (message, type = 'info') => {
        const styles = getStatusStyles(type);
        const newNotif = { id: Date.now(), message, type, icon: styles.icon, timestamp: new Date() };
        notifications.unshift(newNotif);
        if (notifications.length > 100) notifications.pop();
        renderNotifications();
        if (activeTabId === 'systemLog') {
            renderLogList();
        }
    };

    const generateChartLabels = (range) => {
        const days = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 }[range];
        const labels = [];
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            labels.push(date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
        }
        return labels;
    };

    // --- FUNGSI RENDER UI ---
    const renderDateTime = () => {
        const now = new Date();
        elements.currentDatetime.textContent = now.toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const renderPlants = () => {
        elements.plantList.innerHTML = '';
        plants.forEach(plant => {
            const styles = getStatusStyles(plant.status);
            const card = document.createElement('div');
            card.className = `bg-gray-700/50 p-4 rounded-lg flex items-center gap-4 transition hover:bg-gray-700`;
            card.innerHTML = `
                <img src="${plant.image}" alt="${plant.name}" class="w-16 h-16 rounded-full border-2 ${styles.color.replace('text-', 'border-')}" onerror="this.onerror=null;this.src='https://placehold.co/100x100/374151/ffffff?text=img';">
                <div>
                    <p class="font-semibold text-white">${plant.name}</p>
                    <p class="text-sm text-gray-300">Tinggi: ${plant.height} cm</p>
                    <p class="text-xs font-medium ${styles.color} mt-1"><i class="fas ${styles.icon}"></i> ${styles.text}</p>
                </div>
            `;
            elements.plantList.appendChild(card);
        });
    };

    const renderSensorData = () => {
        elements.temperatureValue.textContent = sensorData.temperature.toFixed(1);
        elements.humidityValue.textContent = sensorData.humidity.toFixed(0);
        elements.soilMoistureValue.textContent = sensorData.soilMoisture.toFixed(0);
        
        ['temperature-card', 'humidity-card', 'soil-moisture-card'].forEach(id => {
            document.getElementById(id)?.classList.add('flash-update');
            setTimeout(() => document.getElementById(id)?.classList.remove('flash-update'), 700);
        });
        
        const temp = sensorData.temperature, hum = sensorData.humidity, soil = sensorData.soilMoisture;
        let airMsg = { text: 'Kondisi Udara Ideal', ...getStatusStyles('healthy')};
        if (temp > 32 || temp < 18 || hum > 85 || hum < 50) airMsg = { text: 'Kondisi Udara Kurang Optimal', ...getStatusStyles('warning')};
        if (temp > 35 || temp < 15 || hum > 95 || hum < 40) airMsg = { text: 'Kondisi Udara Buruk!', ...getStatusStyles('critical')};
        elements.airStatus.textContent = airMsg.text;
        elements.airStatus.className = `status-message text-center mt-4 text-sm font-medium p-2 rounded-lg ${airMsg.bg} ${airMsg.color}`;

        let soilMsg = { text: 'Tanah Cukup Lembab', ...getStatusStyles('healthy') };
        if (soil > 80) soilMsg = { text: 'Tanah Terlalu Basah', bg: 'bg-blue-500/20', color: 'text-blue-400' };
        if (soil < 40) soilMsg = { text: 'Tanah Kering, Perlu Air!', ...getStatusStyles('critical') };
        else if (soil < 60) soilMsg = { text: 'Kelembaban Ideal', ...getStatusStyles('warning') };
        elements.soilStatus.textContent = soilMsg.text;
        elements.soilStatus.className = `status-message text-center mt-4 text-sm font-medium p-2 rounded-lg ${soilMsg.bg} ${soilMsg.color}`;
    };
    
    const renderActuatorControls = () => {
        elements.pumpToggle.checked = actuatorStates.pump;
        elements.blowerToggle.checked = actuatorStates.blower;
        elements.pumpStatusText.textContent = actuatorStates.pump ? 'ON' : 'OFF';
        elements.pumpStatusText.className = `font-bold text-lg ${actuatorStates.pump ? 'text-green-400' : 'text-red-400'}`;
        elements.blowerStatusText.textContent = actuatorStates.blower ? 'ON' : 'OFF';
        elements.blowerStatusText.className = `font-bold text-lg ${actuatorStates.blower ? 'text-green-400' : 'text-red-400'}`;
        elements.lastPumpActivation.textContent = actuatorStates.lastPumpActivation ? actuatorStates.lastPumpActivation.toLocaleTimeString('id-ID') : 'N/A';
        elements.pumpDurationToday.textContent = `${Math.round(actuatorStates.pumpDurationToday / 1000)} detik`;
        elements.lastBlowerActivation.textContent = actuatorStates.lastBlowerActivation ? actuatorStates.lastBlowerActivation.toLocaleTimeString('id-ID') : 'N/A';
        elements.blowerDurationToday.textContent = `${Math.round(actuatorStates.blowerDurationToday / 1000)} detik`;
    };
    
    const renderNotifications = () => {
        const formatTimeAgo = (date) => {
            if (!date) return 'N/A';
            const now = new Date();
            const diff = now - date;
            const minutes = Math.floor(diff / 60000);
            if (minutes < 1) return 'Baru saja';
            if (minutes < 60) return `${minutes} menit lalu`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours} jam lalu`;
            const days = Math.floor(hours / 24);
            return `${days} hari lalu`;
        };
        elements.notificationList.innerHTML = notifications.length === 0 
            ? `<li class="p-4 text-center text-gray-500">Tidak ada notifikasi baru.</li>`
            : notifications.map(notif => {
                const styles = getStatusStyles(notif.type);
                return `
                <li class="flex items-start gap-3 p-3 border-b border-gray-700/50 hover:bg-gray-700 transition">
                    <i class="fas ${styles.icon} ${styles.color} mt-1"></i>
                    <div class="flex-1">
                        <p class="text-sm text-gray-200">${notif.message}</p>
                        <p class="text-xs text-gray-500 mt-1">${formatTimeAgo(notif.timestamp)}</p>
                    </div>
                </li>`;
        }).join('');
        const unreadCount = notifications.filter(n => n.type === 'critical' || n.type === 'warning').length;
        elements.notificationCount.textContent = unreadCount;
        elements.notificationCount.style.display = unreadCount > 0 ? 'flex' : 'none';
    };

    const renderTabs = () => {
        const tabs = [
            { id: 'environment', name: 'Lingkungan' },
            { id: 'plantGrowth', name: 'Pertumbuhan' },
            { id: 'plantCondition', name: 'Kondisi Tanaman' },
            { id: 'systemLog', name: 'Log Sistem' }
        ];

        elements.tabNavigation.innerHTML = tabs.map(tab => `
            <button data-tab="${tab.id}" class="tab-button px-4 py-2 text-sm font-medium transition whitespace-nowrap ${activeTabId === tab.id ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}">
                ${tab.name}
            </button>
        `).join('');

        renderTabContent();
        
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                activeTabId = e.target.dataset.tab;
                renderTabs();
            });
        });
    };

    const renderLogList = () => {
        const logListEl = document.getElementById('log-list');
        if (!logListEl) return;
        logListEl.innerHTML = notifications.length > 0 ? notifications.map(n => {
             const styles = getStatusStyles(n.type);
             return `<li class="text-sm p-2 rounded-md flex items-center gap-3 ${styles.bg}">
                <i class="fas ${styles.icon} ${styles.color}"></i>
                <div>
                    <span class="font-mono text-xs text-gray-400">[${n.timestamp.toLocaleString('id-ID')}]</span> 
                    <span class="text-gray-200">${n.message}</span>
                </div>
             </li>`;
        }).join('') : `<li class="text-center text-gray-500 py-4">Belum ada log sistem.</li>`;
    };
    
    const renderTabContent = () => {
        let content = '';
        let timeRangeHTML = '';
        
        if (['environment', 'plantGrowth', 'plantCondition'].includes(activeTabId)) {
            content = `<div class="w-full h-[400px]"><canvas id="analyticsChart"></canvas></div>`;
            const ranges = { '7d': '1 M', '14d': '2 M', '30d': '1 B', '90d': '3 B' };
            timeRangeHTML = `
                <div class="flex items-center gap-2 mb-4">
                    <span class="text-sm text-gray-400">Rentang:</span>
                    <div class="flex rounded-lg bg-gray-700 p-1">
                        ${Object.entries(ranges).map(([key, value]) => `
                            <button data-range="${key}" class="time-range-btn px-3 py-1 text-xs font-semibold rounded-md transition ${activeTimeRange === key ? 'active' : 'text-gray-300 hover:bg-gray-600'}">
                                ${value}
                            </button>
                        `).join('')}
                    </div>
                </div>`;
        } else if (activeTabId === 'systemLog') {
             content = `<ul id="log-list" class="h-[400px] overflow-y-auto space-y-2 pr-2"></ul>`;
        }
        
        elements.tabContent.innerHTML = timeRangeHTML + content;
        
        setTimeout(() => {
            if (activeTabId === 'environment') createEnvironmentChart(activeTimeRange);
            if (activeTabId === 'plantGrowth') createPlantGrowthChart(activeTimeRange);
            if (activeTabId === 'plantCondition') createPlantConditionChart(activeTimeRange);
            if (activeTabId === 'systemLog') renderLogList();

            document.querySelectorAll('.time-range-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    activeTimeRange = e.target.dataset.range;
                    renderTabs();
                });
            });
        }, 50);
    };
    
    // --- PEMBUATAN GRAFIK ---
    const createChart = (id, config) => {
        if (charts[id]) charts[id].destroy();
        const ctx = document.getElementById(id)?.getContext('2d');
        if (ctx) charts[id] = new Chart(ctx, config);
    };

    const chartDefaultOptions = (yLabel = '') => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { color: '#d1d5db' } },
            tooltip: { backgroundColor: '#1f2937', titleColor: '#ffffff', bodyColor: '#d1d5db', borderColor: '#4b5563', borderWidth: 1 }
        },
        scales: {
            x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
            y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255, 255, 255, 0.1)' }, title: { display: !!yLabel, text: yLabel, color: '#9ca3af' } }
        }
    });

    const createEnvironmentChart = (range) => {
        const days = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 }[range];
        createChart('analyticsChart', {
            type: 'line',
            data: {
                labels: generateChartLabels(range),
                datasets: [
                    { label: 'Suhu (°C)', data: Array.from({length: days}, () => 26 + Math.random() * 5), borderColor: '#f87171', backgroundColor: '#f8717133', tension: 0.3, fill: true },
                    { label: 'K. Udara (%)', data: Array.from({length: days}, () => 70 + Math.random() * 10), borderColor: '#60a5fa', backgroundColor: '#60a5fa33', tension: 0.3, fill: true },
                    { label: 'K. Tanah (%)', data: Array.from({length: days}, () => 60 + Math.random() * 20), borderColor: '#facc15', backgroundColor: '#facc1533', tension: 0.3, fill: true }
                ]
            },
            options: chartDefaultOptions()
        });
    };

    const createPlantGrowthChart = (range) => {
        const days = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 }[range];
        createChart('analyticsChart', {
            type: 'line',
            data: {
                labels: generateChartLabels(range),
                datasets: plants.map(p => ({
                    label: p.name,
                    data: Array.from({length: days}, (_, i) => p.height - (days-1-i)/2 + Math.random() * 2),
                    borderColor: { healthy: '#22c55e', warning: '#f97316', critical: '#ef4444'}[p.status],
                    tension: 0.3
                }))
            },
            options: chartDefaultOptions('Tinggi (cm)')
        });
    };
    
    const createPlantConditionChart = (range) => {
        const days = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 }[range];
        const statusMap = { 0: 'Mati', 1: 'Cacat', 2: 'Layu', 3: 'Hidup' };
        
        const datasets = plants.map(plant => {
            let currentStatus = { healthy: 3, warning: 2.2, critical: 1.2 }[plant.status];
            const data = Array.from({ length: days }, () => {
                currentStatus += (Math.random() - 0.48);
                return Math.max(0, Math.min(3, currentStatus));
            });
            return {
                label: plant.name,
                data: data,
                borderColor: { healthy: '#22c55e', warning: '#f97316', critical: '#ef4444'}[plant.status],
                tension: 0.4,
                stepped: true
            };
        });
        
        const options = chartDefaultOptions();
        options.scales.y.min = 0;
        options.scales.y.max = 3;
        options.scales.y.ticks = {
            color: '#9ca3af',
            stepSize: 1,
            callback: function(value) { return statusMap[value]; }
        };
        options.plugins.tooltip.callbacks = {
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) { label += ': '; }
                const value = Math.round(context.parsed.y);
                label += statusMap[value] || 'Tidak diketahui';
                return label;
            }
        };

        createChart('analyticsChart', {
            type: 'line',
            data: { labels: generateChartLabels(range), datasets: datasets },
            options: options
        });
    };

    // --- PENANGANAN EVENT ---
    const handleRefresh = () => {
        const btn = elements.refreshBtn;
        btn.innerHTML = `<i class="fas fa-sync-alt animate-spin"></i> <span class="hidden sm:inline">Memuat...</span>`;
        btn.disabled = true;
        setTimeout(() => {
            sensorData.temperature = 25 + Math.random() * 5;
            sensorData.humidity = 70 + Math.random() * 15;
            sensorData.soilMoisture = 50 + Math.random() * 30;
            renderSensorData();
            renderTabs();
            addNotification('Dashboard berhasil diperbarui', 'info');
            btn.innerHTML = `<i class="fas fa-sync-alt"></i> <span class="hidden sm:inline">Refresh</span>`;
            btn.disabled = false;
        }, 1000);
    };

    const handleToggleActuator = (type, checkbox) => {
        const isOn = checkbox.checked;
        actuatorStates[type] = isOn;
        if (isOn) {
            actuatorStates[`last${type.charAt(0).toUpperCase() + type.slice(1)}Activation`] = new Date();
            addNotification(`Kontrol ${type} telah diaktifkan`, 'info');
        } else {
            const lastActivation = actuatorStates[`last${type.charAt(0).toUpperCase() + type.slice(1)}Activation`];
            if (lastActivation) actuatorStates[`${type}DurationToday`] += (new Date() - lastActivation);
             addNotification(`Kontrol ${type} telah dimatikan`, 'info');
        }
        renderActuatorControls();
    };

    const setupEventListeners = () => {
        elements.refreshBtn.addEventListener('click', handleRefresh);
        elements.notificationBell.addEventListener('click', () => elements.notificationCenter.classList.remove('translate-x-full'));
        elements.closeNotificationsBtn.addEventListener('click', () => elements.notificationCenter.classList.add('translate-x-full'));
        elements.pumpToggle.addEventListener('change', (e) => handleToggleActuator('pump', e.target));
        elements.blowerToggle.addEventListener('change', (e) => handleToggleActuator('blower', e.target));
    };
    
    // --- INISIALISASI UTAMA ---
    const init = () => {
        renderDateTime();
        setInterval(renderDateTime, 1000);
        
        renderPlants();
        renderSensorData();
        renderActuatorControls();
        renderNotifications();
        renderTabs();
        setupEventListeners();
        
        addNotification('Sistem monitoring pertanian dimulai.', 'info');
        if (plants.some(p => p.status === 'critical')) {
            addNotification('Ada tanaman dalam kondisi kritis!', 'critical');
        }

        // Simulasi pembaruan data sensor secara berkala
        setInterval(() => {
            sensorData.temperature += (Math.random() - 0.5);
            sensorData.humidity += (Math.random() - 0.5) * 2;
            sensorData.soilMoisture += (Math.random() - 0.5) * 3;
            sensorData.temperature = Math.max(15, Math.min(40, sensorData.temperature));
            sensorData.humidity = Math.max(40, Math.min(100, sensorData.humidity));
            sensorData.soilMoisture = Math.max(10, Math.min(95, sensorData.soilMoisture));
            renderSensorData();
        }, 7000);
    };

    init();
});
