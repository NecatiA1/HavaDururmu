const WEBHOOK_URL = "https://gimli-stage.odealapp.com/api/v1/webhooks/1NLitSiGDNBAEbLy4UJID/sync"; // <-- kendi URL'ini koy

const sehirInput = document.getElementById("sehir");
const btn = document.getElementById("btn");
const statusEl = document.getElementById("status");
const sonucEl = document.getElementById("sonuc");

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
  statusEl.textContent = "Yükleniyor...";

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
    sonucEl.innerHTML = `
      <strong>${data.sehir}</strong> için hava durumu:<br/><br/>
      🌡️ Sıcaklık: ${s} °C<br/>
      💨 Rüzgar: ${r} km/h
    `;
  } catch (err) {
    console.error(err);
    statusEl.innerHTML = `<span class="err">İstek başarısız. Konsolu kontrol et.</span>`;
  } finally {
    btn.disabled = false;
  }
}
