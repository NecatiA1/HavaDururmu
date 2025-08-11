// 1) /sync EKLE — kendi URL'ini yaz
const WEBHOOK_URL = "https://gimli-stage.odealapp.com/api/v1/webhooks/g20npSHruuLJBAyFTh1Hk/sync";

const sehirInput = document.getElementById("sehir");
const btn = document.getElementById("btn");
const statusEl = document.getElementById("status");
const weatherAnimEl = document.getElementById("weatherAnim");
const topbarEl = document.getElementById("topbar");
const locationInfoEl = document.getElementById("locationInfo");
const worldMapEl = document.getElementById("worldMap");

// Yeni layout elementleri
const mainTempEl = document.getElementById("mainTemp");
const mainConditionEl = document.getElementById("mainCondition");
const weatherIconEl = document.getElementById("weatherIcon");
const weatherDetailsEl = document.getElementById("weatherDetails");
const weatherContainerEl = document.querySelector(".weather-container");

// Harita değişkenleri
let worldMap = null;
let currentMarker = null;

// Buton + Enter
btn.addEventListener("click", manuelArama);
sehirInput.addEventListener("keydown", (e) => { if (e.key === "Enter") manuelArama(); });

// Harita başlatma
function initWorldMap() {
  if (!worldMapEl || worldMap) return;
  
  worldMap = L.map(worldMapEl, {
    center: [39.9334, 32.8597], // Ankara merkez
    zoom: 2,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    touchZoom: false,
    doubleClickZoom: false,
    scrollWheelZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false
  });

  // Dark themed tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 10,
    minZoom: 1
  }).addTo(worldMap);
}

// Şehir koordinatlarını bulma fonksiyonu
async function getCityCoordinates(cityName) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`);
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.warn("Koordinat bulunamadı:", error);
    return null;
  }
}

// Haritada şehri gösterme
function showCityOnMap(cityName) {
  if (!worldMap) return;
  
  getCityCoordinates(cityName).then(coords => {
    if (coords) {
      // Önceki marker'ı kaldır
      if (currentMarker) {
        worldMap.removeLayer(currentMarker);
      }
      
      // Yeni marker ekle
      currentMarker = L.circleMarker([coords.lat, coords.lng], {
        radius: 8,
        fillColor: "#38bdf8",
        color: "#fff",
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.6
      }).addTo(worldMap);
      
      // Haritayı şehre odakla (smooth animasyon)
      worldMap.flyTo([coords.lat, coords.lng], 4, {
        duration: 2,
        easeLinearity: 0.1
      });
      
      // Haritayı görünür yap
      worldMapEl.classList.add('active');
    }
  });
}

// ---- Manuel şehirle arama ----
async function manuelArama() {
  const q = (sehirInput.value || "").trim();
  clearWeatherDisplay();
  hideWeatherContainer(); // Yeni arama başladığında gizle
  if (!q) {
    statusEl.innerHTML = `<span class="err">Şehir boş olamaz.</span>`;
    return;
  }
  await sorgulaVeGoster({ cityName: q, days: 7 });
}

// Hava durumu görünümünü temizle
function clearWeatherDisplay() {
  if (mainTempEl) mainTempEl.textContent = "--°";
  if (mainConditionEl) mainConditionEl.textContent = "Hava Durumu";
  if (weatherIconEl) weatherIconEl.innerHTML = "";
  if (weatherDetailsEl) weatherDetailsEl.innerHTML = "";
}

// Hava durumu container'ını göster
function showWeatherContainer() {
  if (weatherContainerEl) {
    weatherContainerEl.classList.add('show');
  }
  // Body'ye search-active class ekle (arama barını yukarı al)
  document.body.classList.add('search-active');
}

// Hava durumu container'ını gizle  
function hideWeatherContainer() {
  if (weatherContainerEl) {
    weatherContainerEl.classList.remove('show');
  }
  // search-active class'ını kaldırma - arama barı yukarıda kalsın
}

// ---- Ortak: Flow'a istek at, sonucu işle ----
async function sorgulaVeGoster(body) {
  btn.disabled = true;
  statusEl.innerHTML = `<span class="spinner"></span>Yükleniyor...`;
  setWeatherBackground(null);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body) // ÖNEMLİ: {"q":"Ankara"} ya da {"lat":..,"lon":..}
    });
    console.log("asd", res)
    if (!res.ok) {
      statusEl.innerHTML = `<span class="err">Sunucu hatası: ${res.status}</span>`;
      return;
    }

    const data = await res.json();
    console.log("Gelen:", data); // beklenen: { konum, anlik, gunluk }

    // Beklenen alanlar (WeatherAPI → Return Response'unda böyle dönüyor olmalı)
    const konum = data?.konum || {};
    const anlik = data?.anlik || {};
    
    const s = Number(anlik.sicaklik);
    const r = Number(anlik.ruzgar_kmh);
    const nem = Number(anlik.nem);
    const uv = Number(anlik.uv);
    const feelslike = Number(anlik.feelslike);
    
    const sehirAdi = konum.ad || (typeof body.cityName === "string" ? body.cityName : "Konum");
    const ulke = konum.ulke || "";
    const zaman = konum.zaman || "";

    if (Number.isNaN(s) || Number.isNaN(r)) {
      statusEl.innerHTML = `<span class="err">Veri alınamadı veya beklenen formatta değil.</span>`;
      return;
    }

    // Konum bilgisi (header)
    if (locationInfoEl) {
      locationInfoEl.innerHTML = `
        <div class="location-badge">
          <span class="location-icon">📍</span>
          <span class="location-text">${sehirAdi}${ulke ? `, ${ulke}` : ''}</span>
        </div>
        ${zaman ? `<div class="location-time">${new Date(zaman).toLocaleDateString('tr-TR', {weekday: 'long', month: 'long', day: 'numeric'})}</div>` : ''}
      `;
    }
    
    // Büyük sıcaklık gösterimi
    if (mainTempEl) {
      mainTempEl.textContent = `${s}°`;
    }
    
    // Ana durum
    const conditionLabel = pickLabelByTempWind(s, r);
    if (mainConditionEl) {
      mainConditionEl.textContent = conditionLabel;
    }
    
    // Küçük weather icon (sıcaklığın yanında)
    const tempEmoji = s <= 0 ? "❄️" : (s < 15 ? "🌥️" : (s < 28 ? "🌤️" : "🔥"));
    if (weatherIconEl) {
      weatherIconEl.innerHTML = `${tempEmoji}`;
    }
    
    // Ana detaylar (sıcaklığın altında büyük kutucuklar)
    const windEmoji = r > 40 ? "🌬️" : "🍃";
    const humidityEmoji = nem > 70 ? "💧" : "💨";
    const uvEmoji = uv > 7 ? "☀️" : (uv > 3 ? "🌤️" : "🌥️");
    
    if (weatherDetailsEl) {
      weatherDetailsEl.innerHTML = `
        <div class="main-detail-grid">
          <div class="main-detail-item">
            <div class="main-detail-icon">${windEmoji}</div>
            <div class="main-detail-label">Rüzgar</div>
            <div class="main-detail-value">${r} km/h</div>
          </div>
          <div class="main-detail-item">
            <div class="main-detail-icon">${humidityEmoji}</div>
            <div class="main-detail-label">Nem</div>
            <div class="main-detail-value">${!Number.isNaN(nem) ? nem + "%" : "-"}</div>
          </div>
          <div class="main-detail-item">
            <div class="main-detail-icon">${uvEmoji}</div>
            <div class="main-detail-label">UV İndeksi</div>
            <div class="main-detail-value">${!Number.isNaN(uv) ? uv : "-"}</div>
          </div>
          <div class="main-detail-item">
            <div class="main-detail-icon">🌡️</div>
            <div class="main-detail-label">Hissedilen</div>
            <div class="main-detail-value">${!Number.isNaN(feelslike) ? feelslike + "°C" : "-"}</div>
          </div>
        </div>
      `;
    }
    


    if(topbarEl) topbarEl.classList.add('compact');
    setWeatherBackground(pickWeatherMood(s, r));
    
    // Haritayı başlat ve şehri göster
    if (!worldMap) initWorldMap();
    showCityOnMap(sehirAdi);
    
    // Hava durumu container'ını göster
    showWeatherContainer();
    
    // Status'u temizle
    statusEl.innerHTML = "";
  } catch (err) {
    console.error(err);
    statusEl.innerHTML = `<span class="err">İstek başarısız. Konsolu kontrol et.</span>`;
  } finally {
    btn.disabled = false;
  }
}

// ---- UI yardımcıları ----
function pickWeatherMood(temp, wind){
  if (temp <= 0) return 'snowy';
  if (wind > 35) return 'rainy';
  if (temp < 15) return 'cloudy';
  return 'sunny';
}

function setWeatherBackground(mood){
  if(!weatherAnimEl) return;
  weatherAnimEl.className = 'weather-anim';
  if(!mood) return;
  weatherAnimEl.classList.add(mood);
}

function pickLabelByTempWind(temp, wind){
  if (temp <= 0) return 'Karlı';
  if (wind > 45) return 'Fırtınalı';
  if (wind > 30) return 'Rüzgarlı';
  if (temp < 10) return 'Serin';
  if (temp < 20) return 'Ilık';
  if (temp >= 30) return 'Sıcak';
  return 'Açık';
}

// Sayfa yüklendiğinde haritayı başlat
document.addEventListener('DOMContentLoaded', function() {
  // Harita başlatma işlemini biraz geciktir
  setTimeout(() => {
    if (typeof L !== 'undefined') {
      initWorldMap();
    }
  }, 500);
});
