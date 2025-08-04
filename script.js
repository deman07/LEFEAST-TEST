const list = document.getElementById("departuresList");
let lastRenderedRids = new Set();

// Get departures from RailData API
async function fetchDepartures() {
  const url = 'https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120/GetDepartureBoard/BON';
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

function filterUpcomingDepartures(departures) {
  const now = new Date();
  return departures.filter(dep => {
    const timeStr = (dep.etd && dep.etd.toLowerCase() !== "on time" && dep.etd.toLowerCase() !== "cancelled")
      ? dep.etd  // use expected time if it's a delay
      : dep.std; // otherwise use scheduled time

    if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) return true; // keep "On time" and weird entries

    const [hours, minutes] = timeStr.split(":").map(Number);
    const depTime = new Date();
    depTime.setHours(hours, minutes, 0, 0);

    // include if now is before the expected or scheduled time
    return depTime >= now;
  });
}

function renderDepartures(departures) {
  const currentRids = new Set(departures.map(d =>
    d.rid || d.serviceID || d.std + d.destination?.[0]?.locationName
  ));

  const hasChanged =
    departures.length !== lastRenderedRids.size ||
    [...currentRids].some(r => !lastRenderedRids.has(r));

  if (!hasChanged) return;

  list.innerHTML = '';

  departures.slice(0, 3).forEach(dep => {
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
  clock.textContent = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
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
  setInterval(update, 15000);
}

startDepartureUpdates();
