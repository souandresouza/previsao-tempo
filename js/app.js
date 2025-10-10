// Variáveis globais
let intervaloAtualizacao;
let currentTheme = localStorage.getItem('theme') || 'light';

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Configurar tema
    setTheme(currentTheme);
    
    // Configurar event listeners
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('searchBtn').addEventListener('click', pesquisarClima);
    document.getElementById('saveBtn').addEventListener('click', salvarConfiguracoes);
    document.getElementById('testBtn').addEventListener('click', testarCoordenadas);
    document.getElementById('clearBtn').addEventListener('click', limparDados);
    
    // Carregar configurações salvas
    carregarConfiguracoes();
    
    // Buscar previsão automática se tiver dados salvos
    const apiKey = localStorage.getItem('weatherApiKey');
    const latitude = localStorage.getItem('weatherLatitude');
    const longitude = localStorage.getItem('weatherLongitude');
    
    if (apiKey && latitude && longitude) {
        document.getElementById('savedInfo').style.display = 'block';
        pesquisarClima();
    }
}

// Sistema de Temas
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    currentTheme = theme;
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Resto do código JavaScript (as funções que já tínhamos) permanece igual...
// [Aqui viriam todas as outras funções: salvarConfiguracoes, carregarConfiguracoes, limparDados, etc.]
// ... (mantenha todo o resto do código JavaScript que já tínhamos)

// Função para salvar configurações no LocalStorage
function salvarConfiguracoes() {
    const apiKey = document.getElementById('apiKey').value;
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    
    if (apiKey) {
        localStorage.setItem('weatherApiKey', apiKey);
    }
    
    if (latitude) {
        localStorage.setItem('weatherLatitude', latitude);
    }
    
    if (longitude) {
        localStorage.setItem('weatherLongitude', longitude);
    }
    
    // Mostrar mensagem de confirmação
    const savedInfo = document.getElementById('savedInfo');
    savedInfo.style.display = 'block';
    setTimeout(() => {
        savedInfo.style.display = 'none';
    }, 3000);
}

// Função para carregar configurações do LocalStorage
function carregarConfiguracoes() {
    const savedApiKey = localStorage.getItem('weatherApiKey');
    const savedLatitude = localStorage.getItem('weatherLatitude');
    const savedLongitude = localStorage.getItem('weatherLongitude');
    
    if (savedApiKey) {
        document.getElementById('apiKey').value = savedApiKey;
    }
    
    if (savedLatitude) {
        document.getElementById('latitude').value = savedLatitude;
    }
    
    if (savedLongitude) {
        document.getElementById('longitude').value = savedLongitude;
    }
}

// Função para limpar dados do LocalStorage
function limparDados() {
    localStorage.removeItem('weatherApiKey');
    localStorage.removeItem('weatherLatitude');
    localStorage.removeItem('weatherLongitude');
    
    // Limpar campos do formulário
    document.getElementById('apiKey').value = '';
    document.getElementById('latitude').value = '';
    document.getElementById('longitude').value = '';
    
    // Parar atualizações automáticas
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
    }
    
    // Esconder resultado
    document.getElementById('weatherResult').style.display = 'none';
    
    // Mostrar mensagem de confirmação
    alert('Dados limpos com sucesso!');
}

// Função para testar coordenadas no mapa
function testarCoordenadas() {
    const lat = document.getElementById('latitude').value;
    const lon = document.getElementById('longitude').value;
    
    if (!lat || !lon) {
        mostrarErro("Por favor, insira latitude e longitude para testar no mapa.");
        return;
    }
    
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        mostrarErro("Coordenadas inválidas para teste no mapa.");
        return;
    }
    
    // Abrir Google Maps e OpenStreetMap em novas abas
    window.open(`https://www.google.com/maps/place/${lat},${lon}`, '_blank');
    window.open(`https://www.openstreetmap.org/#map=17/${lat}/${lon}`, '_blank');
}

// Função principal para pesquisar o clima
function pesquisarClima() {
    const apiKey = document.getElementById('apiKey').value;
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // Validação dos campos
    if (!apiKey || !latitude || !longitude) {
        mostrarErro("Por favor, preencha todos os campos: chave da API, latitude e longitude.");
        return;
    }
    
    // Validação básica de coordenadas
    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        mostrarErro("Por favor, insira coordenadas válidas. Latitude: -90 a 90, Longitude: -180 a 180.");
        return;
    }
    
    // Limpar mensagens de erro anteriores
    errorMessage.style.display = 'none';
    
    // Mostrar carregamento
    const weatherResult = document.getElementById('weatherResult');
    weatherResult.innerHTML = "<p>Carregando dados meteorológicos...</p>";
    weatherResult.style.display = 'block';
    
    // Buscar dados climáticos
    buscarDadosClimaticos(apiKey, latitude, longitude);
    
    // Configurar atualização automática a cada 10 minutos (600000 ms)
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
    }
    
    intervaloAtualizacao = setInterval(() => {
        console.log("Atualizando dados meteorológicos...");
        buscarDadosClimaticos(apiKey, latitude, longitude);
    }, 600000);
}

// Função para obter nome do local via geocoding reverso (mais preciso)
function obterNomeLocal(lat, lon, apiKey) {
    const geocodingUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
    
    return fetch(geocodingUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro no geocoding');
            }
            return response.json();
        })
        .then(data => {
            if (data && data.length > 0) {
                // Retorna o nome mais específico possível
                return data[0].name || `${data[0].lat}, ${data[0].lon}`;
            }
            return `${lat}, ${lon}`; // Fallback para coordenadas
        })
        .catch(error => {
            console.error('Erro no geocoding:', error);
            // Fallback para Nominatim (OpenStreetMap) se OpenWeather falhar
            return obterNomeLocalNominatim(lat, lon);
        });
}

// Geocoding alternativo com Nominatim (OpenStreetMap)
function obterNomeLocalNominatim(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=pt-BR`;
    
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.address) {
                // Tenta obter o nome mais específico possível
                return data.address.neighbourhood || 
                       data.address.suburb ||
                       data.address.residential ||
                       data.address.quarter ||
                       data.address.village || 
                       data.address.town || 
                       data.address.city || 
                       data.display_name.split(',')[0];
            }
            return `${lat}, ${lon}`;
        })
        .catch(error => {
            console.error('Erro no geocoding Nominatim:', error);
            return `${lat}, ${lon}`;
        });
}

// Função para buscar dados da API OpenWeather
function buscarDadosClimaticos(apiKey, lat, lon) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;
    
    // Primeiro obtém o nome correto do local via geocoding reverso
    obterNomeLocal(lat, lon, apiKey)
        .then(nomeLocal => {
            // Depois busca os dados climáticos
            return fetch(weatherUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(dadosClima => {
                    // Substitui o nome da cidade pelo nome mais preciso do geocoding
                    dadosClima.name = nomeLocal;
                    // Adiciona coordenadas para referência
                    dadosClima.coord = { lat: parseFloat(lat), lon: parseFloat(lon) };
                    exibirClima(dadosClima);
                });
        })
        .catch(error => {
            console.error('Erro ao buscar dados:', error);
            mostrarErro("Não foi possível obter os dados. Verifique sua chave da API, as coordenadas e sua conexão com a internet.");
        });
}

// Função para exibir os dados climáticos
function exibirClima(dados) {
    const weatherResult = document.getElementById('weatherResult');
    
    // Verificar se a API retornou um erro
    if (dados.cod && dados.cod !== 200) {
        mostrarErro(`Erro: ${dados.message}`);
        return;
    }
    
    // Extrair informações dos dados
    const cidade = dados.name || "Localização desconhecida";
    const descricao = dados.weather[0].description;
    const iconeCodigo = dados.weather[0].icon;
    const temperatura = Math.round(dados.main.temp);
    const sensacaoTermica = Math.round(dados.main.feels_like);
    const umidade = dados.main.humidity;
    const pressao = dados.main.pressure;
    const vento = (dados.wind.speed * 3.6).toFixed(1); // Converter m/s para km/h
    
    // URL do ícone
    const urlIcone = `https://openweathermap.org/img/wn/${iconeCodigo}@2x.png`;
    
    // Criar HTML para exibir os dados
    weatherResult.innerHTML = `
        <h2 class="location">${cidade}</h2>
        <div class="coordinates">
            Coordenadas: ${dados.coord.lat.toFixed(4)}, ${dados.coord.lon.toFixed(4)}
        </div>
        <div class="weather-main">
            <img class="weather-icon" src="${urlIcone}" alt="${descricao}">
            <div class="temperature">${temperatura}°C</div>
        </div>
        <div class="weather-desc">${descricao}</div>
        
        <div class="weather-details">
            <div class="detail-item">
                <div class="detail-label">Sensação Térmica</div>
                <div class="detail-value">${sensacaoTermica}°C</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Umidade</div>
                <div class="detail-value">${umidade}%</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Pressão</div>
                <div class="detail-value">${pressao} hPa</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Vento</div>
                <div class="detail-value">${vento} km/h</div>
            </div>
        </div>
        
        <div class="last-update">
            Última atualização: ${new Date().toLocaleTimeString('pt-BR')}
        </div>
    `;
    
    weatherResult.style.display = 'block';
}

// Função para exibir mensagens de erro
function mostrarErro(mensagem) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = mensagem;
    errorMessage.style.display = 'block';
    
    // Esconder resultado se houver erro
    document.getElementById('weatherResult').style.display = 'none';
}