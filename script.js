const WEBHOOK_URL = "https://gimli-stage.odealapp.com/api/v1/webhooks/1NLitSiGDNBAEbLy4UJID/sync"; // <-- kendi URL'ini koy

const sehirInput = document.getElementById("sehir");
const btn = document.getElementById("btn");
const statusEl = document.getElementById("status");
const sonucEl = document.getElementById("sonuc");
const weatherAnimEl = document.getElementById("weatherAnim");
const cityTitleEl = document.getElementById("cityTitle");
const topbarEl = document.getElementById("topbar");

btn.addEventListener("click", havaDurumuGetir);
sehirInput.addEventListener("keydown", (e) => { if (e.key === "Enter") havaDurumuGetir(); });

async function havaDurumuGetir() {
  const sehir = (sehirInput.value || "").trim();
  sonucEl.innerHTML = "";
  if (!sehir) {
    statusEl.innerHTML = `<span class="err">Şehir boş olamaz.</span>`;
    return;
  }

  btn.disabled = true;
  statusEl.innerHTML = `<span class="spinner"></span>Yükleniyor...`;
  setWeatherBackground(null);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sehir })
    });

    if (!res.ok) {
      statusEl.innerHTML = `<span class="err">Sunucu hatası: ${res.status}</span>`;
      btn.disabled = false;
      return;
    }

    const data = await res.json();
    console.log("Gelen:", data);

    // Activepieces’ten dönen alanlar:
    // { sehir: "...", sicaklik: <num veya "str">, ruzgar: <num veya "str"> }
    const s = Number(data.sicaklik);
    const r = Number(data.ruzgar);

    if (!data.sehir || Number.isNaN(s) || Number.isNaN(r)) {
      statusEl.innerHTML = `<span class="err">Veri alınamadı veya beklenen formatta değil.</span>`;
      btn.disabled = false;
      return;
    }

    statusEl.innerHTML = `<span class="ok">Başarılı ✓</span>`;
    const tempEmoji = s <= 0 ? "❄️" : (s < 15 ? "🌥️" : (s < 28 ? "🌤️" : "🔥"));
    const windEmoji = r > 40 ? "🌬️" : "🍃";
    cityTitleEl.textContent = `${data.sehir}`;
    // 3 kutu: Durum, Sıcaklık, Rüzgar
    sonucEl.innerHTML = `
      <div class="tile">
        <div class="label">Durum</div>
        <div class="value">${tempEmoji} ${pickLabelByTempWind(s, r)}</div>
      </div>
      <div class="tile">
        <div class="label">Sıcaklık</div>
        <div class="value">${s} °C</div>
      </div>
      <div class="tile">
        <div class="label">Rüzgar</div>
        <div class="value">${windEmoji} ${r} km/h</div>
      </div>
    `;
    // Topbar'ı kompakt moda al
    if(topbarEl) topbarEl.classList.add('compact');
    const mood = pickWeatherMood(s, r);
    setWeatherBackground(mood);
  } catch (err) {
    console.error(err);
    statusEl.innerHTML = `<span class="err">İstek başarısız. Konsolu kontrol et.</span>`;
  } finally {
    btn.disabled = false;
  }
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
