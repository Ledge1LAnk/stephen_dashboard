let dataTimeoutHandle;  

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAiDlSZC8NqsL1k2ZCtYk2t51WjFoO8HC0",
  authDomain: "smart-energy-management-meter.firebaseapp.com",
  databaseURL: "https://smart-energy-management-meter-default-rtdb.firebaseio.com",
  projectId: "smart-energy-management-meter",
  storageBucket: "smart-energy-management-meter.firebasestorage.app",
  messagingSenderId: "941265682056",
  appId: "1:941265682056:web:5f86cda9870bcb8055693d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const connectionStatus = document.getElementById('connectionStatus');

// Connection state monitoring
firebase.database().ref('.info/connected').on('value', (snapshot) => {
  if (snapshot.val() === true) {
    connectionStatus.classList.add('connected');
    connectionStatus.querySelector('span').textContent = 'Connected';
  } else {
    connectionStatus.classList.remove('connected');
    connectionStatus.querySelector('span').textContent = 'Disconnected';
  }
});

// Data storage for charts
let allPowerData = [];
let allEnergyData = [];
const currentTimeRange = 1; // ~1 hour (for test)
let currentEnergyRange = 24; // hours for energy chart

// Initialize charts
const powerCtx = document.getElementById("powerChart").getContext("2d");
const energyCtx = document.getElementById("energyChart").getContext("2d");

// Power Chart - Fixed to 1 hour
const powerChart = new Chart(powerCtx, {
  type: 'line',
  data: {
    datasets: [{
      label: 'Power (W)',
      data: [],
      borderColor: '#00ff9d',
      backgroundColor: 'rgba(0, 255, 157, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.2,
      pointRadius: 0,
      pointBackgroundColor: '#00ff9d',
      pointHoverRadius: 5
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
          displayFormats: {
            minute: 'HH:mm'
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#aaa',
          maxTicksLimit: 10,
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Time',
          color: '#aaa',
          font: {
            size: 13
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#aaa',
          font: {
            size: 12
          }
        },
        title: {
          display: true,
          text: 'Power (W)',
          color: '#aaa',
          font: {
            size: 13
          }
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#fff',
          boxWidth: 0,
          font: {
            size: 13
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#00ff9d',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(tooltipItems) {
            return 'Power Consumption';
          },
          label: function(context) {
            return `Power: ${context.parsed.y.toFixed(2)} W`;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }
});

// Energy Chart
const energyChart = new Chart(energyCtx, {
  type: 'line',
  data: {
    datasets: [{
      label: 'Energy (kWh)',
      data: [],
      borderColor: '#00b8ff',
      backgroundColor: 'rgba(0, 184, 255, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      pointBackgroundColor: '#00b8ff',
      pointHoverRadius: 5
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#aaa',
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Time',
          color: '#aaa',
          font: {
            size: 13
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#aaa',
          font: {
            size: 12
          }
        },
        title: {
          display: true,
          text: 'Energy (kWh)',
          color: '#aaa',
          font: {
            size: 13
          }
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#fff',
          boxWidth: 0,
          font: {
            size: 13
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#00b8ff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(tooltipItems) {
            return 'Energy Usage';
          },
          label: function(context) {
            return `Energy: ${context.parsed.y.toFixed(3)} kWh`;
          }
        }
      }
    }
  }
});

// Update power chart with fixed 1-hour time range
function updatePowerChart() {
  const now = Date.now();
  const maxAge = currentTimeRange * 60 * 60 * 1000; // Convert to milliseconds (1 hour)
  
  // Filter data based on fixed time range
  const filteredData = allPowerData.filter(point => now - point.x <= maxAge);
  
  // Update chart
  powerChart.data.datasets[0].data = filteredData;
  powerChart.options.scales.x.time.unit = 'minute'; // Show minutes for 1-hour range
  powerChart.options.scales.x.time.displayFormats = {
    minute: 'HH:mm'
  };

  powerChart.options.scales.x.ticks.maxTicksLimit = 6; // Show 6 ticks
  
  powerChart.update('none');
}

// Update energy chart with time filter
function updateEnergyChart() {
  const now = Date.now();
  const maxAge = currentEnergyRange * 60 * 60 * 1000; // Convert to milliseconds
  
  // Filter data based on current time range
  const filteredData = allEnergyData.filter(point => now - point.x <= maxAge);
  
  // Update chart
  energyChart.data.datasets[0].data = filteredData;
  energyChart.update();
}

// Time range selectors for energy chart
document.querySelectorAll('#energy-range .time-range-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('#energy-range .time-range-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentEnergyRange = parseInt(this.dataset.range);
    updateEnergyChart();
  });
});

// Listen for realtime data updates
database.ref('sensor_data').on('value', (snapshot) => {
  const data = snapshot.val();
  if (data) {
    document.getElementById('voltage').textContent = data.voltage.toFixed(2);
    document.getElementById('current').textContent = data.current.toFixed(2);
    document.getElementById('power').textContent = data.power.toFixed(2);
    document.getElementById('energy').textContent = data.energy.toFixed(3);
    document.getElementById('frequency').textContent = data.frequency.toFixed(2);
    document.getElementById('powerFactor').textContent = data.power_factor.toFixed(2);
    
    const timestamp = Date.now();
    
    // Add new power data point
    allPowerData.push({
      x: timestamp,
      y: data.power
    });
    
    // Add new energy data point
    allEnergyData.push({
      x: timestamp,
      y: data.energy
    });
    
    // Update charts
    updatePowerChart();
    updateEnergyChart();
  }
});

// Create relay controls for 4 relays + 1 main power
const relayLabels = ["Light 1", "Light 2", "Outlet 1", "Outlet 2", "Main Power"];
const relayControls = document.getElementById("relayControls");

// Create icons array matching labels
const relayIcons = ["💡", "💡", "🔌", "🔌", "⚡"];

relayLabels.forEach((label, i) => {
  const div = document.createElement("div");
  div.className = "control-card";
  
  if (i === 4) {
    // Main Power - same styling as other relays but controls all
    div.innerHTML = `
      <div class="power-icon">${relayIcons[i]}</div>
      <h3 class="control-title">${label}</h3>
      <label class="switch">
        <input type="checkbox" id="mainPowerSwitch">
        <span class="slider"></span>
      </label>
    `;
    
    const mainPowerCheckbox = div.querySelector("#mainPowerSwitch");
    const mainPowerRef = database.ref('control/main_power');
    
    // Listen for Firebase updates
    mainPowerRef.on('value', (snapshot) => {
      const state = snapshot.val();
      mainPowerCheckbox.checked = state;
      if (state) {
        div.classList.add('active');
      } else {
        div.classList.remove('active');
      }
    });
    
    // Handle user input
    mainPowerCheckbox.addEventListener('change', function() {
      const state = this.checked;
      mainPowerRef.set(state);
      
      // Control all relays based on main power state
      for (let j = 1; j <= 4; j++) {
        database.ref(`control/relay${j}`).set(state);
      }
    });
    
  } else {
    // Regular relay controls
    const index = i + 1;
    div.innerHTML = `
      <div class="power-icon">${relayIcons[i]}</div>
      <h3 class="control-title">${label}</h3>
      <label class="switch">
        <input type="checkbox" id="switch${index}">
        <span class="slider"></span>
      </label>
    `;
    
    const checkbox = div.querySelector("input");
    const ref = database.ref(`control/relay${index}`);
    
    // Listen for Firebase updates
    ref.on('value', (snapshot) => {
      const state = snapshot.val();
      checkbox.checked = state;
      if (state) {
        div.classList.add('active');
      } else {
        div.classList.remove('active');
      }
    });
    
    // Handle user input
    checkbox.addEventListener('change', function() {
      const state = this.checked;
      ref.set(state);
    });
  }
  
  relayControls.appendChild(div);
});

// Load previous data
function loadHistoricalData() {
  const historyRef = database.ref('history');
  historyRef.once('value', snapshot => {
    const data = snapshot.val();
    if (!data) return;

    allPowerData = [];
    allEnergyData = [];

    Object.entries(data).forEach(([key, value]) => {
      const timestamp = parseInt(key) * 1000; // convert seconds to ms
      allPowerData.push({ x: timestamp, y: value.power });
      allEnergyData.push({ x: timestamp, y: value.energy });
    });

    updatePowerChart();
    updateEnergyChart();
  });
}

// Call to load previous data
loadHistoricalData();

// Clear existing timeout
if (dataTimeoutHandle) {
  clearTimeout(dataTimeoutHandle);
}

// Set a new 30s timeout to reset display
dataTimeoutHandle = setTimeout(() => {
  console.warn("No data received from ESP32 in 30 seconds. Resetting display.");
  
  // Reset card values to 0
  document.getElementById('voltage').textContent = "0.00";
  document.getElementById('current').textContent = "0.00";
  document.getElementById('power').textContent = "0.00";
  document.getElementById('energy').textContent = "0.000";
  document.getElementById('frequency').textContent = "0.00";
  document.getElementById('powerFactor').textContent = "0.00";

  // Optionally clear charts
  powerChart.data.datasets[0].data = [];
  energyChart.data.datasets[0].data = [];
  powerChart.update();
  energyChart.update();
}, 30000); // 30,000 ms = 30s
