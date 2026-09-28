const DOM = {
    ipInput: document.getElementById('ipInput'),
    searchBtn: document.getElementById('searchBtn'),
    statusMessage: document.getElementById('statusMessage'),
    resultContainer: document.getElementById('resultContainer'),
    
    // Values
    valCountry: document.getElementById('valCountry'),
    valRegion: document.getElementById('valRegion'),
    valCity: document.getElementById('valCity'),
    valZip: document.getElementById('valZip'),
    valISP: document.getElementById('valISP'),
    valOrg: document.getElementById('valOrg'),
    valASN: document.getElementById('valASN'),
    valTimezone: document.getElementById('valTimezone'),
    
    // Technical Data
    valClass: document.getElementById('valClass'),
    valScope: document.getElementById('valScope'),
    valProtocol: document.getElementById('valProtocol'),
    valPing: document.getElementById('valPing')
};

let map = null;
let marker = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Start tracking the user's IP on load
    trackIP('');
    
    DOM.searchBtn.addEventListener('click', handleSearch);
    DOM.ipInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
});

function handleSearch() {
    const ip = DOM.ipInput.value.trim();
    trackIP(ip);
}

function isPrivateIP(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    
    const num0 = parseInt(parts[0], 10);
    const num1 = parseInt(parts[1], 10);
    const num2 = parseInt(parts[2], 10);
    const num3 = parseInt(parts[3], 10);
    
    // IANA IPv4 Special-Purpose Address Registry
    if (num0 === 0) return true; // Current network
    if (num0 === 10) return true; // Private 10.x
    if (num0 === 100 && num1 >= 64 && num1 <= 127) return true; // CGNAT
    if (num0 === 127) return true; // Loopback
    if (num0 === 169 && num1 === 254) return true; // APIPA
    if (num0 === 172 && num1 >= 16 && num1 <= 31) return true; // Private 172.16-31.x
    if (num0 === 192 && num1 === 0 && num2 === 0) return true; // IETF
    if (num0 === 192 && num1 === 0 && num2 === 2) return true; // TEST-NET-1
    if (num0 === 192 && num1 === 88 && num2 === 99) return true; // 6to4
    if (num0 === 192 && num1 === 168) return true; // Private 192.168.x
    if (num0 === 198 && (num1 === 18 || num1 === 19)) return true; // Benchmark
    if (num0 === 198 && num1 === 51 && num2 === 100) return true; // TEST-NET-2
    if (num0 === 203 && num1 === 0 && num2 === 113) return true; // TEST-NET-3
    if (num0 >= 224 && num0 <= 239) return true; // Multicast
    if (num0 >= 240 && num0 <= 255) return true; // Experimental / Broadcast
    
    return false;
}

function getIPClass(ip) {
    if (!ip) return '-';
    if (ip.includes(':')) return 'IPv6';
    const parts = ip.split('.');
    if (parts.length !== 4) return '-';
    
    const num0 = parseInt(parts[0], 10);
    if (num0 >= 1 && num0 <= 127) return 'Classe A';
    if (num0 >= 128 && num0 <= 191) return 'Classe B';
    if (num0 >= 192 && num0 <= 223) return 'Classe C';
    if (num0 >= 224 && num0 <= 239) return 'Classe D (Multicast)';
    if (num0 >= 240 && num0 <= 255) return 'Classe E (Experimental)';
    return '-';
}

function getIPScope(ip) {
    if (!ip) return '-';
    if (ip.includes(':')) return 'Público / Link-Local IPv6';
    const parts = ip.split('.');
    if (parts.length !== 4) return 'Desconhecido';
    
    const num0 = parseInt(parts[0], 10);
    const num1 = parseInt(parts[1], 10);
    const num2 = parseInt(parts[2], 10);
    const num3 = parseInt(parts[3], 10);
    
    if (num0 === 0) return 'This Network (Zeroconf)';
    if (num0 === 10) return 'Privado (Classe A - LAN)';
    if (num0 === 100 && num1 >= 64 && num1 <= 127) return 'Compartilhado (CGNAT)';
    if (num0 === 127) return 'Loopback (Localhost)';
    if (num0 === 169 && num1 === 254) return 'APIPA (Link-Local)';
    if (num0 === 172 && num1 >= 16 && num1 <= 31) return 'Privado (Classe B - LAN)';
    if (num0 === 192 && num1 === 0 && num2 === 0) return 'Reservado (IETF Protocol)';
    if (num0 === 192 && num1 === 0 && num2 === 2) return 'Reservado (TEST-NET-1)';
    if (num0 === 192 && num1 === 88 && num2 === 99) return 'Reservado (6to4 Relay)';
    if (num0 === 192 && num1 === 168) return 'Privado (Classe C - LAN)';
    if (num0 === 198 && (num1 === 18 || num1 === 19)) return 'Reservado (Benchmark Tests)';
    if (num0 === 198 && num1 === 51 && num2 === 100) return 'Reservado (TEST-NET-2)';
    if (num0 === 203 && num1 === 0 && num2 === 113) return 'Reservado (TEST-NET-3)';
    if (num0 >= 224 && num0 <= 239) return 'Multicast';
    if (num0 === 255 && num1 === 255 && num2 === 255 && num3 === 255) return 'Broadcast Limitado';
    if (num0 >= 240 && num0 <= 255) return 'Reservado (Experimental)';
    
    return 'Público (Internet)';
}

async function trackIP(ipAddress) {
    try {
        setLoadingState(true);
        
        // Verifica se é IP Privado/Resevado
        if (ipAddress && isPrivateIP(ipAddress)) {
            const scopeString = getIPScope(ipAddress);
            // Mock data para rede interna/reservada
            const privateData = {
                ip: ipAddress,
                success: true,
                country: scopeString,
                country_code: 'LAN/RES',
                region: 'Rede Restrita / Interna',
                city: 'N/A',
                postal: 'N/A',
                isp: 'IANA Special-Purpose',
                org: 'Dispositivo / Rotas Especiais',
                asn: 'N/A',
                timezone: 'Local',
                latitude: 0, // Ponto neutro para o mapa (Equator)
                longitude: 0
            };
            
            updateUI(privateData);
            updateMap(privateData.latitude, privateData.longitude, "Rede Privada Oculta");
            setLoadingState(false, 'IP Privado detectado com sucesso!', 'success');
            return;
        }

        // ipwhois.app API (Free, no key needed, HTTPS supported)
        const url = ipAddress ? `https://ipwhois.app/json/${ipAddress}` : `https://ipwhois.app/json/`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Não foi possível conectar ao serviço.');
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'IP inválido ou reservado.');
        }

        updateUI(data);
        updateMap(data.latitude, data.longitude, data.city);
        
        setLoadingState(false, 'Informações carregadas com sucesso!', 'success');
        
        // Populate input with detected IP if it was empty initially
        if (!ipAddress) {
            DOM.ipInput.value = data.ip;
        }

    } catch (error) {
        setLoadingState(false, error.message, 'error');
    }
}

function updateUI(data) {
    // Unhide the grid
    DOM.resultContainer.classList.remove('hidden');

    const flagImg = data.country_flag ? `<img src="${data.country_flag}" alt="Bandeira" style="width:20px; vertical-align:middle; margin-left:8px; border-radius:3px;">` : '';
    
    DOM.valCountry.innerHTML = `${data.country} (${data.country_code}) ${flagImg}`;
    DOM.valRegion.textContent = data.region || 'Desconhecido';
    DOM.valCity.textContent = data.city || 'Desconhecido';
    DOM.valZip.textContent = data.postal || 'N/A';
    
    DOM.valISP.textContent = data.isp || 'Desconhecido';
    DOM.valOrg.textContent = data.org || 'Desconhecido';
    DOM.valASN.textContent = data.asn || 'N/A';
    DOM.valTimezone.textContent = data.timezone_gmt ? `${data.timezone} (GMT ${data.timezone_gmt})` : 'Desconhecido';

    // Technical Data
    if (data.ip) {
        DOM.valClass.textContent = getIPClass(data.ip);
        DOM.valScope.textContent = getIPScope(data.ip);
        DOM.valProtocol.textContent = data.ip.includes(':') ? 'IPv6' : 'IPv4';
        
        // Dispara o Teste de Ping
        webPing(data.ip);
    } else {
        DOM.valClass.textContent = '-';
        DOM.valScope.textContent = '-';
        DOM.valProtocol.textContent = '-';
        DOM.valPing.textContent = '-';
    }
}

// Pseudo-Ping Avançado via Frontend (TCP RST / HTTP Handshake)
async function webPing(ip) {
    if (!ip) return;
    
    DOM.valPing.textContent = 'Enviando pacotes...';
    DOM.valPing.style.color = 'var(--text-muted)';
    
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout (Considerado Drop)
    
    try {
        // Tenta buscar no IP de forma cega. 
        await fetch(`http://${ip}`, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);
        
        const endTime = performance.now();
        const ms = Math.round(endTime - startTime);
        DOM.valPing.textContent = `Online (${ms}ms) HTTP`;
        DOM.valPing.style.color = 'var(--success)';
        
    } catch (err) {
        clearTimeout(timeoutId);
        const endTime = performance.now();
        const ms = Math.round(endTime - startTime);
        
        if (err.name === 'AbortError') {
             // Deu timeout total. O IP é um "Blackhole", está desligado, ou é puramente ICMP block no firewall.
             DOM.valPing.textContent = 'Inalcançável (Timeout)';
             DOM.valPing.style.color = 'var(--error)';
        } else {
             // O IP está VIVO mas a conexão foi rejeitada (TCP RST) ativamente.
             // Isso prova que o IP é pingável/existe na rede.
             if (ms < 2500) {
                 DOM.valPing.textContent = `Ativo/Pingável (${ms}ms) TCP-RST`;
                 DOM.valPing.style.color = 'var(--primary-blue)';
             } else {
                 DOM.valPing.textContent = 'Offline / Bloqueado';
                 DOM.valPing.style.color = 'var(--error)';
             }
        }
    }
}

function updateMap(lat, lng, city) {
    const isPrivateOrReserved = (lat === 0 && lng === 0);
    const zoom = isPrivateOrReserved ? 2 : 13;

    // Custom neon marker icon (criado uma vez)
    const neonIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #00d2ff; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 15px 5px rgba(0, 210, 255, 0.8);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    if (!map) {
        // Primeira inicialização do mapa
        map = L.map('map').setView([lat, lng], zoom);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        marker = L.marker([lat, lng], {icon: neonIcon}).addTo(map);
    } else {
        // Atualiza posição/zoom e força re-render dos tiles
        map.setView([lat, lng], zoom);
        marker.setLatLng([lat, lng]);
        // Corrige tiles cinzas ao redimensionar/reutilizar o container
        setTimeout(() => map.invalidateSize(), 200);
    }
    
    // Remove popup anterior e cria um novo
    marker.unbindPopup();
    if (isPrivateOrReserved) {
        marker.bindPopup(`<b>📡 ${city || 'Endereço Restrito/Local'}</b><br><small>Sem geolocalização pública</small>`).openPopup();
    } else {
        marker.bindPopup(`<b>📍 ${city}</b>`).openPopup();
    }
}

function setLoadingState(isLoading, message = '', type = '') {
    if (isLoading) {
        DOM.searchBtn.innerHTML = '<i class="ph ph-spinner-gap ph-spin"></i> Buscando...';
        DOM.searchBtn.disabled = true;
        DOM.statusMessage.textContent = 'Processando coordenadas...';
        DOM.statusMessage.className = 'status-msg';
    } else {
        DOM.searchBtn.innerHTML = '<i class="ph ph-magnifying-glass"></i> Rastrear';
        DOM.searchBtn.disabled = false;
        DOM.statusMessage.textContent = message;
        DOM.statusMessage.className = `status-msg ${type}`;
    }
}
