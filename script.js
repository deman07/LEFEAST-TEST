const list = document.getElementById("departuresList");
let lastRenderedRids = new Set();

// Get departures from RailData API
async function fetchDepartures() {
  const url = 'https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120/GetDepartureBoard/BON?numRows=15';
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

// Filter upcoming departures using ETD (delayed time) when available
function filterUpcomingDepartures(departures) {
  const now = new Date();
  return departures.filter(dep => {
    const etdLower = (dep.etd || "").toLowerCase();
    const useETD = etdLower !== "on time" && etdLower !== "cancelled" && /^\d{1,2}:\d{2}$/.test(dep.etd);

    const timeStr = useETD ? dep.etd : dep.std;
    if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) return true;

    const [hours, minutes] = timeStr.split(":").map(Number);
    const depTime = new Date();
    depTime.setHours(hours, minutes, 0, 0);

    return depTime >= now;
  });
}

// Render only if content changed
function renderDepartures(departures) {
  const currentRids = new Set(departures.map(d =>
    d.rid || d.serviceID || d.std + d.destination?.[0]?.locationName
  ));

  const hasChanged =
    departures.length !== lastRenderedRids.size ||
    [...currentRids].some(r => !lastRenderedRids.has(r));

  if (!hasChanged) return;

  list.innerHTML = '';

  departures.slice(0, 11).forEach(dep => {
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
      statusText = `Expected ${etd}`;
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

  lastRenderedRids = currentRids;
}

// Clock at top right
function updateClock() {
  const now = new Date();
  const clock = document.getElementById("clock");
  if (clock) {
    clock.textContent = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
}

// Start the full update loop
async function startDepartureUpdates() {
  updateClock();
  setInterval(updateClock, 1000);

  const update = async () => {
    const data = await fetchDepartures();
    const upcoming = filterUpcomingDepartures(data);
    renderDepartures(upcoming);
  };

  await update();
  setInterval(update, 30000);
}

startDepartureUpdates();






