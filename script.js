// 1) /sync EKLE — kendi URL'ini yaz
const WEBHOOK_URL = "https://gimli-stage.odealapp.com/api/v1/webhooks/g20npSHruuLJBAyFTh1Hk/sync";

const sehirInput = document.getElementById("sehir");
const btn = document.getElementById("btn");
const statusEl = document.getElementById("status");
const sonucEl = document.getElementById("sonuc");
const weatherAnimEl = document.getElementById("weatherAnim");
const cityTitleEl = document.getElementById("cityTitle");
const topbarEl = document.getElementById("topbar");

// Buton + Enter
btn.addEventListener("click", manuelArama);
sehirInput.addEventListener("keydown", (e) => { if (e.key === "Enter") manuelArama(); });

// ---- Manuel şehirle arama ----
async function manuelArama() {
  const q = (sehirInput.value || "").trim();
  sonucEl.innerHTML = "";
  if (!q) {
    statusEl.innerHTML = `<span class="err">Şehir boş olamaz.</span>`;
    return;
  }
  await sorgulaVeGoster({ q, days: 7 });
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

    if (!res.ok) {
      statusEl.innerHTML = `<span class="err">Sunucu hatası: ${res.status}</span>`;
      return;
    }

    const data = await res.json();
    console.log("Gelen:", data); // beklenen: { konum, anlik, gunluk }

    // Beklenen alanlar (WeatherAPI → Return Response'unda böyle dönüyor olmalı)
    const s = Number(data?.anlik?.sicaklik);
    const r = Number(data?.anlik?.ruzgar_kmh);
    const sehirAdi = data?.konum?.ad || (typeof body.q === "string" ? body.q : "Konum");

    if (Number.isNaN(s) || Number.isNaN(r)) {
      statusEl.innerHTML = `<span class="err">Veri alınamadı veya beklenen formatta değil.</span>`;
      return;
    }

    // Başlık
    cityTitleEl.textContent = sehirAdi;
    // Durum etiketi
    const tempEmoji = s <= 0 ? "❄️" : (s < 15 ? "🌥️" : (s < 28 ? "🌤️" : "🔥"));
    const windEmoji = r > 40 ? "🌬️" : "🍃";

    // 3 kutu
    sonucEl.innerHTML = `
      <div class="tile">
        <div class="label">Durum</div>
        <div class="value">${tempEmoji} ${pickLabelByTempWind(s, r)}${data?.anlik?.durum ? " – " + data.anlik.durum : ""}</div>
      </div>
      <div class="tile">
        <div class="label">Sıcaklık</div>
        <div class="value">${s} °C</div>
      </div>
      <div class="tile">
        <div class="label">Rüzgar</div>
        <div class="value">${windEmoji} ${r} km/h</div>
      </div>
      ${renderGunluk(data?.gunluk)}
    `;

    if(topbarEl) topbarEl.classList.add('compact');
    setWeatherBackground(pickWeatherMood(s, r));
    statusEl.innerHTML = `<span class="ok">Başarılı ✓</span>`;
  } catch (err) {
    console.error(err);
    statusEl.innerHTML = `<span class="err">İstek başarısız. Konsolu kontrol et.</span>`;
  } finally {
    btn.disabled = false;
  }
}

// ---- UI yardımcıları ----
function renderGunluk(gunluk){
  if(!Array.isArray(gunluk)) return "";
  const cards = gunluk.slice(0,5).map(d => {
    const tmax = d?.day?.maxtemp_c ?? "-";
    const tmin = d?.day?.mintemp_c ?? "-";
    const text = d?.day?.condition?.text ?? "";
    const icon = d?.day?.condition?.icon ? `https:${d.day.condition.icon}` : "";
    return `
      <div class="mini-card">
        <div>${d.date || ""}</div>
        ${icon ? `<img src="${icon}" alt="">` : ""}
        <div>↑ ${tmax}°C ↓ ${tmin}°C</div>
        <div>${text}</div>
      </div>
    `;
  }).join("");
  return `<div class="grid">${cards}</div>`;
}

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
