document.addEventListener('DOMContentLoaded', () => {
    
    if (typeof missions_planet_nine_pt === 'undefined' ||
        typeof missions_planet_nine_en === 'undefined' ||
        typeof missions_deep_sea_pt === 'undefined' ||
        typeof missions_deep_sea_en === 'undefined') {
        console.error("ERRO CRÍTICO: Um ou mais arquivos de missão não foram carregados.");
        document.body.innerHTML = "<h1 style='color: red;'>ERRO: Arquivos de missão não encontrados. Verifique se os 4 arquivos .js (pt/en) estão presentes.</h1>";
        return;
    }

    const speechSynthesis = window.speechSynthesis;
    if (!speechSynthesis) {
        console.warn("API de Síntese de Fala não suportada neste navegador.");
    }

    // --- Estrutura de Dados Principal ---
    const gameData = {
        'planet_nine': {
            'pt-BR': {
                title: "A Tripulação: Em Busca do Nono Planeta",
                missions: missions_planet_nine_pt,
                meta_label: "Tarefas:"
            },
            'en': {
                title: "The Crew: The Quest for Planet Nine",
                missions: missions_planet_nine_en,
                meta_label: "Tasks:"
            }
        },
        'deep_sea': {
            'pt-BR': {
                title: "A Tripulação: Missão no Fundo do Mar",
                missions: missions_deep_sea_pt,
                meta_label: "Dificuldade:"
            },
            'en': {
                title: "The Crew: Mission Deep Sea",
                missions: missions_deep_sea_en,
                meta_label: "Difficulty:"
            }
        }
    };

    // --- Dicionário de Tradução da UI ---
    const translations = {
        'pt-BR': {
            'ui:manage_crew': 'Gerenciar Tripulação',
            'ui:active_crew': 'Tripulação Ativa:',
            'ui:crew_name': 'Nomear Tripulação:',
            'ui:crew_name_placeholder': 'Dê um nome...',
            'ui:save_name': 'Salvar Nome',
            'ui:clear_data': 'Limpar Dados desta Tripulação',
            'ui:listen': '🔈 Ouvir História',
            'ui:stop_listen': 'Parar ◼️',
            'ui:attempts': 'Tentativas:',
            'ui:save': 'Salvar',
            'ui:saved': 'Salvo!',
            'ui:total': 'Total:',
            'ui:speech_rate': 'Velocidade da Voz:', // Novo
            'planet_nine:title': 'A Tripulação: Em Busca do Nono Planeta',
            'planet_nine:meta_label': 'Tarefas:',
            'deep_sea:title': 'A Tripulação: Missão no Fundo do Mar',
            'deep_sea:meta_label': 'Dificuldade:',
            'default_crew_name': 'Tripulação',
            'clear_confirm_1': 'Tem certeza de que deseja limpar TODOS os dados da tripulação',
            'clear_confirm_2': 'para o jogo',
            'clear_confirm_3': 'Isso não pode ser desfeito.',
            'clear_alert': 'Dados da tripulação foram limpos.'
        },
        'en': {
            'ui:manage_crew': 'Manage Crew',
            'ui:active_crew': 'Active Crew:',
            'ui:crew_name': 'Crew Name:',
            'ui:crew_name_placeholder': 'Enter a name...',
            'ui:save_name': 'Save Name',
            'ui:clear_data': 'Clear This Crew\'s Data',
            'ui:listen': '🔈 Listen to Story',
            'ui:stop_listen': 'Stop ◼️',
            'ui:attempts': 'Attempts:',
            'ui:save': 'Save',
            'ui:saved': 'Saved!',
            'ui:total': 'Total:',
            'ui:speech_rate': 'Speech Rate:', // Novo
            'planet_nine:title': 'The Crew: The Quest for Planet Nine',
            'planet_nine:meta_label': 'Tasks:',
            'deep_sea:title': 'The Crew: Mission Deep Sea',
            'deep_sea:meta_label': 'Difficulty:',
            'default_crew_name': 'Crew',
            'clear_confirm_1': 'Are you sure you want to clear ALL data for crew',
            'clear_confirm_2': 'for the game',
            'clear_confirm_3': 'This cannot be undone.',
            'clear_alert': 'Crew data has been cleared.'
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
    const langSelectorRadios = document.querySelectorAll('input[name="lang-choice"]');
    const clearTeamDataButton = document.getElementById('clear-team-data-button');
    const playAudioButton = document.getElementById('play-audio-button');
    const speechRateSlider = document.getElementById('speech-rate-slider'); // REQUISIÇÃO
    const speechRateValue = document.getElementById('speech-rate-value'); // REQUISIÇÃO

    // --- Variáveis de Estado ---
    let allGamesDataStorage = {}; 
    let currentGameId = 'planet_nine';
    let currentLang = 'pt-BR';
    let currentSpeechRate = 1.0; // REQUISIÇÃO
    let currentMissionList = [];
    let activeTeamId = '1';

    // --- Funções de Dados (Armazenamento) ---

    function initializeTeamData(lang) {
        const defaultData = {};
        const name = translations[lang]['default_crew_name'];
        for (let i = 1; i <= 6; i++) {
            defaultData[i.toString()] = {
                name: `${name} ${i}`,
                attempts: {},
                currentMissionIndex: 0
            };
        }
        return defaultData;
    }

    // REQUISIÇÃO: Nova função para carregar/salvar configurações
    function loadSettings() {
        const savedSettings = JSON.parse(localStorage.getItem('crewLogbookSettings'));
        if (savedSettings) {
            currentLang = savedSettings.lang || 'pt-BR';
            currentGameId = savedSettings.game || 'planet_nine';
            currentSpeechRate = savedSettings.rate || 1.0;
        }
        
        // Atualiza a UI com as configurações carregadas
        document.querySelector(`input[name="lang-choice"][value="${currentLang}"]`).checked = true;
        document.querySelector(`input[name="game-choice"][value="${currentGameId}"]`).checked = true;
        speechRateSlider.value = currentSpeechRate;
        speechRateValue.textContent = `${currentSpeechRate}x`;
    }

    function saveSettings() {
        const settings = {
            lang: currentLang,
            game: currentGameId,
            rate: currentSpeechRate
        };
        localStorage.setItem('crewLogbookSettings', JSON.stringify(settings));
    }
    
    function loadProgress() {
        const savedData = localStorage.getItem('crewLogbookProgress');
        if (savedData) {
            allGamesDataStorage = JSON.parse(savedData);
        } else {
            allGamesDataStorage = {};
        }

        ['planet_nine', 'deep_sea'].forEach(gameId => {
            if (!allGamesDataStorage[gameId]) allGamesDataStorage[gameId] = {};
            ['pt-BR', 'en'].forEach(lang => {
                if (!allGamesDataStorage[gameId][lang]) {
                    allGamesDataStorage[gameId][lang] = initializeTeamData(lang);
                }
            });
        });

        const currentTeamData = allGamesDataStorage[currentGameId][currentLang];
        teamSelectEl.innerHTML = ''; 
        for (const teamId in currentTeamData) {
            if (!currentTeamData[teamId]) {
                currentTeamData[teamId] = initializeTeamData(currentLang)[teamId];
            }
            const teamName = currentTeamData[teamId].name;
            const option = document.createElement('option');
            option.value = teamId;
            option.textContent = teamName;
            teamSelectEl.appendChild(option);
        }
    }

    function saveProgress() {
        const currentTeamData = allGamesDataStorage[currentGameId][currentLang];
        if (!currentTeamData[activeTeamId]) {
            currentTeamData[activeTeamId] = initializeTeamData(currentLang)[activeTeamId];
        }

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
        const teamAttempts = allGamesDataStorage[currentGameId][currentLang][activeTeamId].attempts;
        let total = 0;
        for (const missionNumber in teamAttempts) {
            total += teamAttempts[missionNumber] || 0;
        }
        totalAttemptsEl.textContent = `${translations[currentLang]['ui:total']} ${total}`;
    }

    // --- Funções de Renderização e UI ---

    function renderMission(missionIndex) {
        if (speechSynthesis && speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        playAudioButton.textContent = translations[currentLang]['ui:listen'];
        playAudioButton.disabled = !speechSynthesis; 

        if (!currentMissionList || !currentMissionList[missionIndex]) {
            console.error(`Erro: 'currentMissionList' não está definido ou 'missionIndex' (${missionIndex}) é inválido.`);
            return; 
        }

        const mission = currentMissionList[missionIndex];
        const teamData = allGamesDataStorage[currentGameId][currentLang][activeTeamId];

        missionNumberEl.textContent = `Missão: ${mission.number}`; 
        
        const meta_label_key = `${currentGameId}:meta_label`;
        missionMetaLabelEl.textContent = translations[currentLang][meta_label_key];
        
        if (currentGameId === 'planet_nine') {
            missionMetaValueEl.textContent = mission.task_count;
            missionMetaContainer.classList.remove('difficulty');
        } else {
            missionMetaValueEl.textContent = mission.difficulty;
            missionMetaContainer.classList.add('difficulty');
        }
        
        if (currentGameId === 'deep_sea' && mission.title) {
            missionStoryEl.innerHTML = `<strong>${mission.title}</strong><br>${mission.story}`;
        } else {
            missionStoryEl.textContent = mission.story;
        }

        if (mission.rules) {
            const rules_key = (currentLang === 'pt-BR') ? 'Regra Especial:' : 'Special Rule:';
            missionRulesEl.innerHTML = `<strong>${rules_key}</strong> ${mission.rules}`;
            missionRulesEl.style.display = 'block';
        } else {
            missionRulesEl.innerHTML = '';
            missionRulesEl.style.display = 'none';
        }

        renderIcons(mission.icons);

        if (!teamData) {
             console.error(`Erro: Não há dados para a equipe ${activeTeamId} no jogo ${currentGameId}/${currentLang}`);
             loadProgress();
        }
        attemptsInput.value = teamData.attempts[mission.number] || 0;

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
                let el = createIcon('comm-penalty', `${range}: `);
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
            createIcon('special-rule', (currentLang === 'pt-BR' ? 'OU' : 'OR'));
        }
        if (icons.difficulty) {
            createIcon('special-rule', `${(currentLang === 'pt-BR' ? 'Dificuldade' : 'Difficulty')} ${icons.difficulty}`);
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

    // --- Funções de Troca de Estado ---

    function switchLanguage(lang) {
        const currentViewedMissionNumberText = missionNumberEl.textContent.split(': ')[1];
        let currentViewedMissionNumber = 1;
        if (currentViewedMissionNumberText) {
            currentViewedMissionNumber = parseInt(currentViewedMissionNumberText);
        }

        if (speechSynthesis && speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }

        currentLang = lang;
        document.documentElement.lang = lang.split('-')[0]; 
        
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.getAttribute('data-lang-key');
            if (translations[lang][key]) {
                if (el.tagName === 'INPUT' && el.type === 'text') {
                    el.placeholder = translations[lang][key];
                } else {
                    el.textContent = translations[lang][key];
                }
            }
        });
        
        saveSettings(); // Salva a nova configuração de idioma
        switchGame(currentGameId, currentViewedMissionNumber);
    }


    function switchGame(gameId, missionToRender = null) {
        if (speechSynthesis && speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }

        currentGameId = gameId;
        saveSettings(); // Salva a nova configuração de jogo
        
        const game = gameData[gameId][currentLang];
        
        if (gameId === 'deep_sea') {
            document.body.classList.add('theme-deep-sea');
        } else {
            document.body.classList.remove('theme-deep-sea');
        }
        
        currentMissionList = game.missions;
        mainTitle.textContent = game.title;
        lastMissionButton.textContent = currentMissionList.length;

        loadProgress(); 
        
        activeTeamId = teamSelectEl.value || '1';
        
        if (!allGamesDataStorage[currentGameId][currentLang][activeTeamId]) {
            allGamesDataStorage[currentGameId][currentLang][activeTeamId] = initializeTeamData(currentLang)[activeTeamId];
        }
        
        const teamData = allGamesDataStorage[currentGameId][currentLang][activeTeamId];
        teamNameInput.value = teamData.name;
        
        let missionIndexToRender = teamData.currentMissionIndex;
        // Se uma missão específica foi passada (pela troca de idioma), use-a
        if (missionToRender !== null) {
            let newIndex = currentMissionList.findIndex(m => m.number === missionToRender);
            if (newIndex !== -1) {
                missionIndexToRender = newIndex;
            }
        }
        
        renderMission(missionIndexToRender);
    }

    // --- Função de Tocar/Parar Áudio (com velocidade) ---
    function toggleAudioPlayback() {
        if (!speechSynthesis) return;

        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            playAudioButton.textContent = translations[currentLang]['ui:listen'];
        } else {
            const currentViewedMissionNumber = parseInt(missionNumberEl.textContent.split(': ')[1]);
            const currentViewedIndex = currentMissionList.findIndex(m => m.number === currentViewedMissionNumber);
            const mission = currentMissionList[currentViewedIndex];
            
            let storyText = "";
            if (currentGameId === 'deep_sea' && mission.title) {
                storyText = `${mission.title}. ${mission.story}`;
            } else {
                storyText = mission.story;
            }
            
            const utterance = new SpeechSynthesisUtterance(storyText);
            utterance.lang = currentLang; 
            utterance.rate = currentSpeechRate; // REQUISIÇÃO: Usa a velocidade do slider

            utterance.onend = () => {
                playAudioButton.textContent = translations[currentLang]['ui:listen'];
            };
            utterance.onerror = (e) => {
                console.error("Erro na síntese de fala:", e);
                playAudioButton.textContent = translations[currentLang]['ui:listen'];
            };

            speechSynthesis.speak(utterance);
            playAudioButton.textContent = translations[currentLang]['ui:stop_listen'];
        }
    }

    // --- Event Listeners ---

    langSelectorRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            switchLanguage(e.target.value);
        });
    });

    gameSelectorRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            switchGame(e.target.value);
        });
    });

    playAudioButton.addEventListener('click', toggleAudioPlayback);

    // REQUISIÇÃO: Listener para o slider de velocidade
    speechRateSlider.addEventListener('input', () => {
        currentSpeechRate = parseFloat(speechRateSlider.value);
        speechRateValue.textContent = `${currentSpeechRate.toFixed(1)}x`;
        saveSettings();
    });

    function navigateAndSave(newMissionIndex) {
        allGamesDataStorage[currentGameId][currentLang][activeTeamId].currentMissionIndex = newMissionIndex;
        renderMission(newMissionIndex);
        saveProgress();
    }

    firstMissionButton.addEventListener('click', () => {
        navigateAndSave(0);
    });

    prevButton.addEventListener('click', () => {
        const currentViewedMissionNumber = parseInt(missionNumberEl.textContent.split(': ')[1]);
        const currentViewedIndex = currentMissionList.findIndex(m => m.number === currentViewedMissionNumber);
        if (currentViewedIndex > 0) {
            navigateAndSave(currentViewedIndex - 1);
        }
    });
        
    nextButton.addEventListener('click', () => {
        const currentViewedMissionNumber = parseInt(missionNumberEl.textContent.split(': ')[1]);
        const currentViewedIndex = currentMissionList.findIndex(m => m.number === currentViewedMissionNumber);
        if (currentViewedIndex < currentMissionList.length - 1) {
            navigateAndSave(currentViewedIndex + 1);
        }
    });

    lastMissionButton.addEventListener('click', () => {
        navigateAndSave(currentMissionList.length - 1);
    });

    saveButton.addEventListener('click', () => {
        const currentViewedMissionNumber = parseInt(missionNumberEl.textContent.split(': ')[1]);
        const currentViewedIndex = currentMissionList.findIndex(m => m.number === currentViewedMissionNumber);

        let attempts = parseInt(attemptsInput.value, 10);
        
        if (isNaN(attempts) || attempts < 0) {
            attempts = 0;
            attemptsInput.value = 0;
        }
        
        allGamesDataStorage[currentGameId][currentLang][activeTeamId].attempts[currentViewedMissionNumber] = attempts;
        allGamesDataStorage[currentGameId][currentLang][activeTeamId].currentMissionIndex = currentViewedIndex;

        saveProgress(); 
        updateTotalAttempts(); 
        
        saveButton.textContent = translations[currentLang]['ui:saved'];
        setTimeout(() => { saveButton.textContent = translations[currentLang]['ui:save']; }, 1000);
    });

    teamSelectEl.addEventListener('change', (e) => {
        activeTeamId = e.target.value;
        const teamData = allGamesDataStorage[currentGameId][currentLang][activeTeamId];
        
        if (!teamData) {
            allGamesDataStorage[currentGameId][currentLang][activeTeamId] = initializeTeamData(currentLang)[activeTeamId];
        }
        
        teamNameInput.value = teamData.name; 
        renderMission(teamData.currentMissionIndex);
    });

    teamNameSaveButton.addEventListener('click', () => {
        const newName = teamNameInput.value.trim();
        if (newName === "") return; 

        allGamesDataStorage[currentGameId][currentLang][activeTeamId].name = newName;

        const option = teamSelectEl.querySelector(`option[value="${activeTeamId}"]`);
        if (option) {
            option.textContent = newName;
        }
        
        saveProgress(); 

        teamNameSaveButton.textContent = translations[currentLang]['ui:saved'];
        setTimeout(() => { teamNameSaveButton.textContent = translations[currentLang]['ui:save_name']; }, 1000);
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

    clearTeamDataButton.addEventListener('click', () => {
        const teamName = allGamesDataStorage[currentGameId][currentLang][activeTeamId].name;
        const gameTitle = gameData[currentGameId][currentLang].title;
        const t = translations[currentLang]; 
        
        if (confirm(`${t['clear_confirm_1']} "${teamName}" ${t['clear_confirm_2']} "${gameTitle}"?\n\n${t['clear_confirm_3']}`)) {
            
            const defaultName = `${t['default_crew_name']} ${activeTeamId}`;
            
            allGamesDataStorage[currentGameId][currentLang][activeTeamId] = {
                name: defaultName,
                attempts: {},
                currentMissionIndex: 0
            };
            
            saveProgress();
            
            teamNameInput.value = defaultName;
            const option = teamSelectEl.querySelector(`option[value="${activeTeamId}"]`);
            if (option) {
                option.textContent = defaultName;
            }
            
            renderMission(0);
            
            alert(t['clear_alert']);
        }
    });


    // --- Inicialização ---
    loadSettings(); // Carrega idioma, jogo e velocidade salvos
    loadProgress(); // Carrega todos os dados de progresso das equipes
    
    // Traduz a UI com o idioma carregado
    switchLanguage(currentLang);
    // Configura o jogo com o jogo carregado
    switchGame(currentGameId, allGamesDataStorage[currentGameId][currentLang][activeTeamId].currentMissionIndex);
});
