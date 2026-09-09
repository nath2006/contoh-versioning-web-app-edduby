//function untuk mengambil dom by id
//pemanggilannya cnth :
//$('card') : artinya kamu ambil sebuah tag dengan id "card"
const $ = (id) => {
  return document.getElementById(id);
}

const btn = $("btn");
const spinner = $("spinner");
const cards = $("cards");
const loc = $("loc");
const addr = $("addr");
const weather = $("weather");
const country = $("country");

btn.addEventListener("click", () => {
  if(!navigator.geolocation){
    alert("Browser Anda tidak mendukung Geolocation.");
    return;
  }

  spinner.classList.remove("d-none");
  cards.classList.remove("d-none");

  navigator.geolocation.getCurrentPosition(load, handleError, {
    enableHighAccuracy: true,
    timeout: 10000,
  });
});

async function load(position){
  try{
    //variabel untuk mengambil data dari geolocation
    const  {latitude, longitude, accuracy} = position.coords; 

    //reverse geolocation (untuk validasi geolocation, agar lebih akurat)
    const geoResponse = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    )

    if(!geoResponse.ok){
      throw new Error("Gagal mengambil data lokasi!");
    }

    //javascript object notation
    const geo = await geoResponse.json();
    
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m`
    )

    if(!weatherResponse.ok){
      throw new Error("Gagal mengambil data cuaca!");
    }

    const weatherData = await weatherResponse.json();

    //flag 
    const flagUrl = `https://flagcdn.com/w320/${geo.countryCode.toLowerCase()}.png`;

    spinner.classList.add("d-none");
    cards.classList.remove("d-none");

    //card lokasinya 
    loc.innerHTML = 
    `
    <h4>📍 Lokasi </h4>
    <p>
      <b>Latitude : ${latitude.toFixed(6)}</b>
      <b>Longitude : ${longitude.toFixed(6)}</b>
      <b>Akurasi : ${Math.round(accuracy)}</b>
    </p>
    `;

    //Card Alamat
    addr.innerHTML = 
    `
    <h4>Alamat </h4>
    <p>
      <b>Kota: ${geo.city || geo.locality || "-"}</b>
      <b>Provinsi : ${geo.principalSubdivision}</b>
      <b>Negara : ${geo.countryName}</b>
    </p>
    `;

    //Card Cuaca
    weather.innerHTML = 
    `
    <h4>Cuaca Saat Ini </h4>
    <p>
      <b>Suhu: ${weatherData.current.temperature_2m}</b>
      <b>Kecepatan Angin: ${weatherData.current.wind_speed_10m}</b>
    </p>
    `;

    //Card negara
    country.innerHTML = 
    `
    <h4>Informasi Negara </h4>
    <div class="text-center mb-3">
      <img src="${flagUrl}" class="img-fluid rounded shadow" style="max-width:120px">
    </div>
    <p>
      <b>Nama Negara: ${geo.countryName}</b>
      <b>Kode Negara : ${geo.countryCode}</b>
      <b>Benua : ${geo.continent}</b>
    </p>
    `;

    history.pushState({}, "", "#dashboard");
  }catch(err){
    spinner.classList.add('d-none');

    alert(err.message);
    console.log(err);
  }
}


function handleError(error){
  spinner.classList.add("d-none");

  switch (error.code){
    case error.PERMISSION_DENIED:
      alert("Izin lokasi ditolak.");
      break;
    case error.POSITION.UNAVAILABLE:
      alert("Lokasi tidak tersedia.");
      break;
    case error.TIMEOUT:
      alert("Terjadi kesalahan saat mengambil lokasi");
      break;
    default:
      alert("Terjadi kesalahan saat mengambil lokasi")
  }
}


window.addEventListener("popstate", () => {
  console.log("History berubah")
});
