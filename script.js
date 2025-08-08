// API anahtarı - OpenWeatherMap'ten ücretsiz alabilirsiniz
const API_KEY = 'YOUR_API_KEY'; // Buraya OpenWeatherMap API anahtarınızı ekleyin
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// DOM elementleri
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const errorMessage = document.getElementById('errorMessage');

// Enter tuşu ile arama
cityInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        getWeather();
    }
});

// Hava durumu verilerini getir
async function getWeather() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Lütfen şehir adını girin!');
        return;
    }

    // API anahtarı kontrolü
    if (API_KEY === 'YOUR_API_KEY') {
        showDemo(city);
        return;
    }

    try {
        showLoading();
        
        const response = await fetch(`${API_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=tr`);
        
        if (!response.ok) {
            throw new Error('Şehir bulunamadı');
        }
        
        const data = await response.json();
        displayWeatherData(data);
        hideError();
        
    } catch (error) {
        showError('Şehir bulunamadı. Lütfen tekrar deneyin.');
        hideLoading();
    }
}

// Hava durumu verilerini göster
function displayWeatherData(data) {
    cityName.textContent = data.name + ', ' + data.sys.country;
    temperature.textContent = Math.round(data.main.temp) + '°C';
    humidity.textContent = data.main.humidity + '%';
    windSpeed.textContent = Math.round(data.wind.speed * 3.6) + ' km/h'; // m/s'den km/h'ye çevir
    
    hideLoading();
}

// Demo veriler (API anahtarı yokken)
function showDemo(city) {
    cityName.textContent = city.charAt(0).toUpperCase() + city.slice(1);
    temperature.textContent = Math.floor(Math.random() * 30 + 5) + '°C';
    humidity.textContent = Math.floor(Math.random() * 60 + 30) + '%';
    windSpeed.textContent = Math.floor(Math.random() * 20 + 5) + ' km/h';
    
    hideError();
    hideLoading();
    
    // API anahtarı uyarısı
    console.log('Demo modu: Gerçek hava durumu verisi için OpenWeatherMap API anahtarı gerekli.');
}

// Yükleniyor durumu
function showLoading() {
    temperature.textContent = '...';
    humidity.textContent = '...';
    windSpeed.textContent = '...';
    searchBtn.disabled = true;
    searchBtn.textContent = 'Yükleniyor...';
}

function hideLoading() {
    searchBtn.disabled = false;
    searchBtn.textContent = 'Ara';
}

// Hata mesajları
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // 3 saniye sonra gizle
    setTimeout(() => {
        hideError();
    }, 3000);
}

function hideError() {
    errorMessage.style.display = 'none';
}

// Sayfa yüklendiğinde input'a odaklan
window.addEventListener('load', function() {
    cityInput.focus();
});

// Popüler şehirler için otomatik tamamlama önerileri
const popularCities = [
    'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 
    'Gaziantep', 'Mersin', 'Diyarbakır', 'Kayseri', 'Eskişehir', 'Urfa',
    'Malatya', 'Erzurum', 'Van', 'Batman', 'Elazığ', 'Trabzon', 'Kocaeli'
];

// Basit otomatik tamamlama
cityInput.addEventListener('input', function() {
    const value = this.value.toLowerCase();
    if (value.length > 1) {
        const suggestions = popularCities.filter(city => 
            city.toLowerCase().includes(value)
        );
        // Burada dropdown menü eklenebilir
    }
});
