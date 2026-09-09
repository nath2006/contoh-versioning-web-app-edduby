// Helper untuk mengambil elemen berdasarkan id agar kode lebih ringkas.
const $ = (id) => document.getElementById(id);

const elements = {
  locationButton: $("locationButton"),
  refreshButton: $("refreshButton"),
  buttonText: $("buttonText"),
  status: $("status"),
  loader: $("loader"),
  cards: $("cards"),
};

const WEATHER_LABELS = {
  0: "Cerah", 1: "Sebagian besar cerah", 2: "Berawan sebagian", 3: "Mendung",
  45: "Berkabut", 48: "Kabut berembun", 51: "Gerimis ringan", 53: "Gerimis",
  55: "Gerimis lebat", 61: "Hujan ringan", 63: "Hujan sedang", 65: "Hujan lebat",
  80: "Hujan lokal ringan", 81: "Hujan lokal", 82: "Hujan lokal lebat",
  95: "Badai petir", 96: "Badai petir dan hujan es", 99: "Badai petir kuat",
};

elements.locationButton.addEventListener("click", getLocation);
elements.refreshButton.addEventListener("click", getLocation);

function getLocation() {
  if (!("geolocation" in navigator)) {
    showStatus("Browser ini tidak mendukung Geolocation API.", "error");
    return;
  }

  setLoading(true);
  navigator.geolocation.getCurrentPosition(loadDashboard, handleLocationError, {
    enableHighAccuracy: true,
    timeout: 10_000,
    maximumAge: 0,
  });
}

async function loadDashboard(position) {
  const { latitude, longitude, accuracy } = position.coords;

  const addressUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`;

  try {
    // Kedua request tidak saling menunggu, jadi dijalankan bersamaan.
    const [addressResponse, weatherResponse] = await Promise.all([
      fetch(addressUrl),
      fetch(weatherUrl),
    ]);

    if (!addressResponse.ok) throw new Error(`API alamat gagal (${addressResponse.status}).`);
    if (!weatherResponse.ok) throw new Error(`API cuaca gagal (${weatherResponse.status}).`);

    const [address, weather] = await Promise.all([
      addressResponse.json(),
      weatherResponse.json(),
    ]);

    renderDashboard({ latitude, longitude, accuracy, address, weather });
    showStatus(`Data berhasil diperbarui pada ${formatTime(new Date())}.`, "success");
    history.replaceState({ dashboard: true }, "", "#dashboard");
  } catch (error) {
    console.error(error);
    showStatus(`Data belum dapat ditampilkan. ${error.message}`, "error");
  } finally {
    setLoading(false);
  }
}

function renderDashboard({ latitude, longitude, accuracy, address, weather }) {
  const current = weather.current;
  const countryCode = (address.countryCode || "").toLowerCase();

  setText("latitude", latitude.toFixed(6));
  setText("longitude", longitude.toFixed(6));
  setText("accuracy", `± ${Math.round(accuracy)} meter`);
  setText("city", address.city || address.locality || "Tidak tersedia");
  setText("province", address.principalSubdivision || "Tidak tersedia");
  setText("countryName", address.countryName || "Tidak tersedia");
  setText("temperature", Math.round(current.temperature_2m));
  setText("weatherDescription", WEATHER_LABELS[current.weather_code] || "Kondisi tidak diketahui");
  setText("windSpeed", `${current.wind_speed_10m} ${weather.current_units.wind_speed_10m}`);
  setText("windDirection", `${current.wind_direction_10m}°`);
  setText("countryFullName", address.countryName || "Tidak tersedia");
  setText("countryCode", address.countryCode || "—");
  setText("continent", address.continent || "—");

  const flag = $("countryFlag");
  if (countryCode) {
    flag.src = `https://flagcdn.com/w160/${countryCode}.png`;
    flag.alt = `Bendera ${address.countryName}`;
    flag.hidden = false;
  } else {
    flag.hidden = true;
  }

  elements.cards.hidden = false;
  elements.refreshButton.hidden = false;
}

function setText(id, value) {
  $(id).textContent = value;
}

function setLoading(isLoading) {
  elements.loader.hidden = !isLoading;
  elements.status.hidden = isLoading;
  elements.locationButton.disabled = isLoading;
  elements.refreshButton.disabled = isLoading;
  elements.buttonText.textContent = isLoading ? "Mengambil data…" : "Gunakan lokasi saya";
}

function showStatus(message, type = "info") {
  elements.status.hidden = false;
  elements.status.className = `status status-${type}`;
  elements.status.querySelector("p").textContent = message;
  elements.status.querySelector(".status-icon").textContent = type === "error" ? "!" : type === "success" ? "✓" : "i";
}

function handleLocationError(error) {
  const messages = {
    [error.PERMISSION_DENIED]: "Izin lokasi ditolak. Aktifkan izin lokasi pada pengaturan browser.",
    [error.POSITION_UNAVAILABLE]: "Lokasi tidak tersedia. Pastikan GPS atau layanan lokasi aktif.",
    [error.TIMEOUT]: "Waktu pencarian lokasi habis. Silakan coba kembali.",
  };

  setLoading(false);
  showStatus(messages[error.code] || "Terjadi kesalahan saat mengambil lokasi.", "error");
}

function formatTime(date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}
