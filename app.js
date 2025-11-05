document.addEventListener('DOMContentLoaded', () => {
    
    // Verificação inicial de dados
    if (typeof missions_planet_nine === 'undefined' || typeof missions_deep_sea === 'undefined') {
        console.error("ERRO CRÍTICO: Os arquivos de missão 'missions_planet_nine.js' e/ou 'missions_deep_sea.js' não foram carregados.");
        document.body.innerHTML = "<h1 style='color: red;'>ERRO: Arquivos de missão não encontrados. Renomeie 'missions.js' para 'missions_planet_nine.js' e adicione 'missions_deep_sea.js'.</h1>";
        return;
    }

    const gameData = {
        planet_nine: {
            title: "A Tripulação: Em Busca do Nono Planeta",
            missions: missions_planet_nine,
            meta_label: "Tarefas:"
        },
        deep_sea: {
            title: "A Tripulação: Missão no Fundo do Mar",
            missions: missions_deep_sea,
            meta_label: "Dificuldade:"
        }
    };

    // --- Seletores de Elementos ---
    const mainTitle = document.getElementById('main-title');
    const missionNumberEl = document.getElementById('mission-number');
    const missionMetaLabelEl = document.getElementById('mission-meta-label');
    const missionMetaValueEl = document.getElementById('mission-meta-value');
    const missionMetaContainer = document.querySelector('.mission-meta');
    const missionStoryEl = document.getElementById('mission-story');
    const missionRulesEl = document.getElementById('mission-rules');
    const missionIconsEl = document.getElementById('mission-icons');
    const attemptsInput = document.getElementById('attempts-input');
    const saveButton = document.getElementById('save-button');
    const teamSelectEl = document.getElementById('team-select');
    const totalAttemptsEl = document.getElementById('total-attempts');
    const teamNameInput = document.getElementById('team-name-input');
    const teamNameSaveButton = document.getElementById('team-name-save-button');
    const firstMissionButton = document.getElementById('first-mission');
    const prevButton = document.getElementById('prev-mission');
    const nextButton = document.getElementById('next-mission');
    const lastMissionButton = document.getElementById('last-mission');
    const gameSelectorRadios = document.querySelectorAll('input[name="game-choice"]');

    // --- Variáveis de Estado ---
    let allGamesDataStorage = {}; // { planet_nine: { "1": {...} }, deep_sea: { "1": {...} } }
    let currentGameId = 'planet_nine';
    let currentMissionList = [];
    let activeTeamId = '1';

    // --- Funções de Dados ---

    function initializeTeamData() {
        const defaultData = {};
        for (let i = 1; i <= 6; i++) {
            defaultData[i.toString()] = {
                name: `Tripulação ${i}`,
                attempts: {},
                currentMissionIndex: 0
            };
        }
        return defaultData;
    }

    function loadProgress() {
        const savedData = localStorage.getItem('crewLogbookProgress');
        if (savedData) {
            allGamesDataStorage = JSON.parse(savedData);
        } else {
            allGamesDataStorage = {};
        }

        // Garante que ambos os jogos tenham dados de equipe
        if (!allGamesDataStorage.planet_nine) {
            allGamesDataStorage.planet_nine = initializeTeamData();
        }
        if (!allGamesDataStorage.deep_sea) {
            allGamesDataStorage.deep_sea = initializeTeamData();
        }

        // Popula o <select> com os nomes salvos para o jogo ATUAL
        const currentTeamData = allGamesDataStorage[currentGameId];
        for (const teamId in currentTeamData) {
            const teamName = currentTeamData[teamId].name;
            const option = teamSelectEl.querySelector(`option[value="${teamId}"]`);
            if (option) {
                option.textContent = teamName;
            }
        }
    }

    function saveProgress() {
        const currentTeamData = allGamesDataStorage[currentGameId];
        const currentMissionNumberText = missionNumberEl.textContent.split(': ')[1];
        if (!currentMissionNumberText) return;

        const currentMissionNumber = parseInt(currentMissionNumberText);
        const missionIndex = currentMissionList.findIndex(m => m.number === currentMissionNumber);
        
        if (missionIndex !== -1 && currentTeamData[activeTeamId]) {
             currentTeamData[activeTeamId].currentMissionIndex = missionIndex;
        }
       
        localStorage.setItem('crewLogbookProgress', JSON.stringify(allGamesDataStorage));
    }

    function updateTotalAttempts() {
        const teamAttempts = allGamesDataStorage[currentGameId][activeTeamId].attempts;
        let total = 0;
        for (const missionNumber in teamAttempts) {
            total += teamAttempts[missionNumber] || 0;
        }
        totalAttemptsEl.textContent = `Total: ${total}`;
    }

    // --- Funções de Renderização ---

    function renderMission(missionIndex) {
        if (!currentMissionList || !currentMissionList[missionIndex]) {
            console.error(`Erro: 'currentMissionList' não está definido ou 'missionIndex' (${missionIndex}) é inválido.`);
            return; 
        }

        const mission = currentMissionList[missionIndex];
        const teamData = allGamesDataStorage[currentGameId][activeTeamId];

        // Atualiza cabeçalho e meta-dados
        missionNumberEl.textContent = `Missão: ${mission.number}`;
        if (currentGameId === 'planet_nine') {
            missionMetaLabelEl.textContent = "Tarefas:";
            missionMetaValueEl.textContent = mission.task_count;
            missionMetaContainer.classList.remove('difficulty');
        } else {
            missionMetaLabelEl.textContent = "Dificuldade:";
            missionMetaValueEl.textContent = mission.difficulty;
            missionMetaContainer.classList.add('difficulty');
        }
        
        // Atualiza história e título (Deep Sea tem títulos)
        if (currentGameId === 'deep_sea' && mission.title) {
            missionStoryEl.innerHTML = `<strong>${mission.title}</strong><br>${mission.story}`;
        } else {
            missionStoryEl.textContent = mission.story;
        }

        // Atualiza Regras
        if (mission.rules) {
            missionRulesEl.innerHTML = `<strong>Regra Especial:</strong> ${mission.rules}`;
            missionRulesEl.style.display = 'block';
        } else {
            missionRulesEl.innerHTML = '';
            missionRulesEl.style.display = 'none';
        }

        // Atualiza Ícones
        renderIcons(mission.icons);

        // Atualiza dados da equipe
        attemptsInput.value = teamData.attempts[mission.number] || 0;
        teamData.currentMissionIndex = missionIndex;

        // Atualiza Botões
        firstMissionButton.disabled = (missionIndex === 0);
        prevButton.disabled = (missionIndex === 0);
        nextButton.disabled = (missionIndex === currentMissionList.length - 1);
        lastMissionButton.disabled = (missionIndex === currentMissionList.length - 1);
        
        updateTotalAttempts();
    }

    function renderIcons(icons) {
        missionIconsEl.innerHTML = '';
        if (!icons) return;

        // Ícones do Nono Planeta
        if (icons.task_tokens) {
            icons.task_tokens.forEach(token => createIcon('task-token', token));
        }
        if (icons.special === 'Ω') {
            createIcon('special-rule omega', 'Ω');
        } else if (icons.special) {
            createIcon('special-rule', icons.special);
        }

        // Ícones do Fundo do Mar
        if (icons.comm) {
            if (icons.comm === 'X') {
                createIcon('comm-penalty no-comm', 'X');
            } else if (icons.comm === '?') {
                createIcon('comm-penalty q-mark', '?');
            } else {
                createIcon('comm-penalty', icons.comm);
            }
        }
        if (icons.comm_split) {
            Object.entries(icons.comm_split).forEach(([range, type]) => {
                let text = `${range}: `;
                let el = createIcon('comm-penalty', text);
                if (type === '?') {
                    el.classList.add('q-mark');
                    el.textContent += '?';
                } else if (type === '-2') {
                    el.textContent += '-2';
                } else {
                    el.textContent += '✓';
                }
            });
        }
        if (icons.timer) {
            createIcon('timer', `⏱ ${icons.timer}`);
        }
        if (icons.or) {
            createIcon('special-rule', 'OU');
        }
        if (icons.difficulty) { // Para Missão 26
            createIcon('special-rule', `Dificuldade ${icons.difficulty}`);
        }
        if (icons.task_cards) {
            icons.task_cards.forEach(cardText => createIcon('task-card', cardText));
        }
    }

    function createIcon(className, text) {
        const iconEl = document.createElement('div');
        iconEl.className = 'icon ' + className;
        iconEl.textContent = text;
        missionIconsEl.appendChild(iconEl);
        return iconEl;
    }

    // --- Função Principal de Troca de Jogo ---

    function switchGame(gameId) {
        currentGameId = gameId;
        const game = gameData[gameId];
        
        currentMissionList = game.missions;
        mainTitle.textContent = game.title;
        lastMissionButton.textContent = currentMissionList.length;

        // Carrega dados da equipe para este jogo
        loadProgress(); // Recarrega os nomes das equipes
        
        // Define o estado da equipe ativa
        activeTeamId = teamSelectEl.value;
        const teamData = allGamesDataStorage[currentGameId][activeTeamId];
        teamNameInput.value = teamData.name;
        
        // Renderiza a missão salva para esta equipe neste jogo
        renderMission(teamData.currentMissionIndex);
    }

    // --- Event Listeners ---

    gameSelectorRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            switchGame(e.target.value);
        });
    });

    firstMissionButton.addEventListener('click', () => {
        renderMission(0);
        saveProgress();
    });

    prevButton.addEventListener('click', () => {
        let currentMissionIndex = allGamesDataStorage[currentGameId][activeTeamId].currentMissionIndex;
        if (currentMissionIndex > 0) {
            renderMission(currentMissionIndex - 1);
            saveProgress(); 
        }
    });
        
    nextButton.addEventListener('click', () => {
        let currentMissionIndex = allGamesDataStorage[currentGameId][activeTeamId].currentMissionIndex;
        if (currentMissionIndex < currentMissionList.length - 1) {
            renderMission(currentMissionIndex + 1);
            saveProgress(); 
        }
    });

    lastMissionButton.addEventListener('click', () => {
        renderMission(currentMissionList.length - 1);
        saveProgress();
    });

    saveButton.addEventListener('click', () => {
        const currentMissionNumber = currentMissionList[allGamesDataStorage[currentGameId][activeTeamId].currentMissionIndex].number;
        let attempts = parseInt(attemptsInput.value, 10);
        
        if (isNaN(attempts) || attempts < 0) {
            attempts = 0;
            attemptsInput.value = 0;
        }
        
        allGamesDataStorage[currentGameId][activeTeamId].attempts[currentMissionNumber] = attempts;
        
        saveProgress(); 
        updateTotalAttempts(); 
        
        saveButton.textContent = 'Salvo!';
        setTimeout(() => { saveButton.textContent = 'Salvar'; }, 1000);
    });

    teamSelectEl.addEventListener('change', (e) => {
        activeTeamId = e.target.value;
        const teamData = allGamesDataStorage[currentGameId][activeTeamId];
        
        if (!teamData) { // Segurança caso os dados não existam
            allGamesDataStorage[currentGameId][activeTeamId] = { name: `Tripulação ${activeTeamId}`, attempts: {}, currentMissionIndex: 0 };
        }
        
        teamNameInput.value = teamData.name; 
        renderMission(teamData.currentMissionIndex);
    });

    teamNameSaveButton.addEventListener('click', () => {
        const newName = teamNameInput.value.trim();
        if (newName === "") return; 

        allGamesDataStorage[currentGameId][activeTeamId].name = newName;

        const option = teamSelectEl.querySelector(`option[value="${activeTeamId}"]`);
        if (option) {
            option.textContent = newName;
        }
        
        saveProgress(); 

        teamNameSaveButton.textContent = 'Salvo!';
        setTimeout(() => { teamNameSaveButton.textContent = 'Salvar Nome'; }, 1000);
    });

    attemptsInput.addEventListener('focus', () => {
        if (attemptsInput.value === '0') {
            attemptsInput.value = '';
        }
    });

    attemptsInput.addEventListener('blur', () => {
        if (attemptsInput.value === '') {
            attemptsInput.value = '0';
        }
    });


    // --- Inicialização ---
    switchGame(currentGameId); // Inicia o jogo padrão ('planet_nine')
});
