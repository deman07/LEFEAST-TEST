const list = document.getElementById("departuresList");

// Get departures from RailData API
async function fetchDepartures() {
  const url = 'https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120/GetDepartureBoard/DON';
  try {
    const response = await fetch(url, {
      headers: {
        'x-apikey': 'alhwZAU5sA6C6X0RA7sGMzINFLxVilt5M1IZGhl6EZpQFpoz'
      }
    });
    const data = await response.json();
    return data.trainServices || [];
  } catch (err) {
    console.error("Error fetching departures:", err);
    return [];
  }
}

function renderDepartures(departures) {
  list.innerHTML = '';

  departures.slice(0, 6).forEach(dep => {
    const destination = dep.destination?.[0]?.locationName || 'Unknown';
    const platform = dep.platform || 'TBD';
    const time = dep.std || 'N/A';
    const etd = (dep.etd || '').toLowerCase();

    let statusClass = 'ontime';
    let statusText = 'On Time';

    if (etd.includes('cancelled')) {
      statusClass = 'cancelled';
      statusText = 'Cancelled';
    } else if (etd !== 'on time' && etd !== '') {
      statusClass = 'delayed';
      statusText = `Delayed. Expected ${etd}`;
    }

    const row = document.createElement("div");
    row.className = "departure-row";

row.innerHTML = `
  <div class="destination">${destination}</div>
  <div class="platform">Platform ${platform}</div>
  <div class="time">${time}</div>
  <div class="status ${statusClass}">${statusText}</div>
`;




    list.appendChild(row);
  });
}


// Clock at top right
function updateClock() {
  const now = new Date();
  const clock = document.getElementById("clock");
  clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Start the full update loop
async function startDepartureUpdates() {
  updateClock();
  setInterval(updateClock, 1000);

  const update = async () => {
const useMock = false;

if (useMock) {
  const mockDepartures = [
    {
      destination: [{ locationName: "Blackpool" }],
      platform: "1",
      std: "20:55",
      etd: "On time"
    },
    {
      destination: [{ locationName: "Manchester Victoria" }],
      platform: "4",
      std: "21:15",
      etd: "Cancelled"
    },
    {
      destination: [{ locationName: "Manchester Oxford Road" }],
      platform: "5",
      std: "21:16",
      etd: "21:22"
    },
    {
      destination: [{ locationName: "York" }],
      platform: "3",
      std: "21:25",
      etd: "On time"
    },
    {
      destination: [{ locationName: "London Euston" }],
      platform: "6",
      std: "21:34",
      etd: "21:50"
    },
    {
      destination: [{ locationName: "Wigan North Western" }],
      platform: "TBD",
      std: "21:48",
      etd: "On time"
    }
  ];

  renderDepartures(mockDepartures);
} else {
  const data = await fetchDepartures();
  renderDepartures(data);
}

  };
  await update();
  setInterval(update, 15000);
}

startDepartureUpdates();

