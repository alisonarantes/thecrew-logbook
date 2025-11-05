document.addEventListener('DOMContentLoaded', () => {
    
    if (typeof missions === 'undefined') {
        console.error("ERRO CRÍTICO: O arquivo 'missions.js' não foi carregado ou está vazio.");
        document.body.innerHTML = "<h1 style='color: red;'>ERRO: 'missions.js' não foi carregado. Verifique se o arquivo existe e não está vazio.</h1>";
        return;
    }

    // Seleciona todos os elementos HTML
    const missionNumberEl = document.getElementById('mission-number');
    const missionTasksEl = document.getElementById('mission-tasks');
    const missionStoryEl = document.getElementById('mission-story');
    const missionRulesEl = document.getElementById('mission-rules');
    const missionIconsEl = document.getElementById('mission-icons');
    const attemptsInput = document.getElementById('attempts-input');
    const saveButton = document.getElementById('save-button');
    const prevButton = document.getElementById('prev-mission');
    const nextButton = document.getElementById('next-mission');
    const teamSelectEl = document.getElementById('team-select');
    const totalAttemptsEl = document.getElementById('total-attempts');
    const teamNameInput = document.getElementById('team-name-input');
    const teamNameSaveButton = document.getElementById('team-name-save-button');

    let allTeamsData = {};
    let activeTeamId = '1';

    // ATUALIZADO: Adiciona a propriedade 'name'
    function initializeData() {
        const defaultData = {};
        for (let i = 1; i <= 6; i++) {
            defaultData[i.toString()] = {
                name: `Tripulação ${i}`, // Nome padrão
                attempts: {},
                currentMissionIndex: 0
            };
        }
        return defaultData;
    }

    function saveProgress() {
        const currentMissionNumberText = missionNumberEl.textContent.split(': ')[1];
        if (!currentMissionNumberText) return;

        const currentMissionNumber = parseInt(currentMissionNumberText);
        const missionIndex = missions.findIndex(m => m.number === currentMissionNumber);
        
        if (missionIndex !== -1 && allTeamsData[activeTeamId]) {
             allTeamsData[activeTeamId].currentMissionIndex = missionIndex;
        }
       
        localStorage.setItem('crewLogbookProgress', JSON.stringify(allTeamsData));
    }

    // ATUALIZADO: Carrega os nomes salvos para o <select>
    function loadProgress() {
        const savedData = localStorage.getItem('crewLogbookProgress');
        if (savedData) {
            allTeamsData = JSON.parse(savedData);
        } else {
            allTeamsData = initializeData();
        }

        // Popula o <select> com os nomes salvos
        for (const teamId in allTeamsData) {
            if (!allTeamsData[teamId]) { // Garante que dados antigos sejam compatíveis
                 allTeamsData[teamId] = { name: `Tripulação ${teamId}`, attempts: {}, currentMissionIndex: 0 };
            }
            const teamName = allTeamsData[teamId].name;
            const option = teamSelectEl.querySelector(`option[value="${teamId}"]`);
            if (option) {
                option.textContent = teamName;
            }
        }
    }

    function updateTotalAttempts() {
        if (!allTeamsData[activeTeamId]) return; // Proteção
        const teamAttempts = allTeamsData[activeTeamId].attempts;
        let total = 0;
        for (const missionNumber in teamAttempts) {
            total += teamAttempts[missionNumber] || 0;
        }
        totalAttemptsEl.textContent = `Total: ${total}`;
    }

    function renderMission(missionIndex) {
        if (!missions || !missions[missionIndex]) {
            console.error(`Erro: 'missions' não está definido ou 'missionIndex' (${missionIndex}) é inválido.`);
            return; 
        }

        const mission = missions[missionIndex];

        missionNumberEl.textContent = `Missão: ${mission.number}`;
        missionTasksEl.textContent = `Tarefas: ${mission.task_count}`;
        missionStoryEl.textContent = mission.story;

        if (mission.rules) {
            missionRulesEl.innerHTML = `<strong>Regra Especial:</strong> ${mission.rules}`;
            missionRulesEl.style.display = 'block';
        } else {
            missionRulesEl.innerHTML = '';
            missionRulesEl.style.display = 'none';
        }

        missionIconsEl.innerHTML = '';
        if (mission.icons) {
            if (mission.icons.task_tokens) {
                mission.icons.task_tokens.forEach(token => {
                    const iconEl = document.createElement('div');
                    iconEl.className = 'icon task-token';
                    iconEl.textContent = token;
                    missionIconsEl.appendChild(iconEl);
                });
            }
            if (mission.icons.special) {
                const iconEl = document.createElement('div');
                iconEl.className = 'icon special-rule';
                iconEl.textContent = mission.icons.special;
                if (mission.icons.special === 'Ω') {
                    iconEl.classList.add('omega');
                }
                missionIconsEl.appendChild(iconEl);
            }
        }

        if (!allTeamsData[activeTeamId]) {
             console.error(`Erro: Não há dados para a equipe ${activeTeamId}`);
             loadProgress();
        }
        attemptsInput.value = allTeamsData[activeTeamId].attempts[mission.number] || 0;
        allTeamsData[activeTeamId].currentMissionIndex = missionIndex;

        prevButton.disabled = (missionIndex === 0);
        nextButton.disabled = (missionIndex === missions.length - 1);
        updateTotalAttempts();
    }

    // --- Event Listeners ---

    nextButton.addEventListener('click', () => {
        let currentMissionIndex = allTeamsData[activeTeamId].currentMissionIndex;
        if (currentMissionIndex < missions.length - 1) {
            renderMission(currentMissionIndex + 1);
            saveProgress(); 
        }
    });

    prevButton.addEventListener('click', () => {
        let currentMissionIndex = allTeamsData[activeTeamId].currentMissionIndex;
        if (currentMissionIndex > 0) {
            renderMission(currentMissionIndex - 1);
            saveProgress(); 
        }
    });

    saveButton.addEventListener('click', () => {
        const currentMissionNumber = missions[allTeamsData[activeTeamId].currentMissionIndex].number;
        let attempts = parseInt(attemptsInput.value, 10);
        
        if (isNaN(attempts) || attempts < 0) {
            attempts = 0;
            attemptsInput.value = 0;
        }
        
        allTeamsData[activeTeamId].attempts[currentMissionNumber] = attempts;
        
        saveProgress(); 
        updateTotalAttempts(); 
        
        saveButton.textContent = 'Salvo!';
        setTimeout(() => { saveButton.textContent = 'Salvar'; }, 1000);
    });

    // ATUALIZADO: Atualiza o input de nome ao trocar de equipe
    teamSelectEl.addEventListener('change', (e) => {
        activeTeamId = e.target.value;
        if (!allTeamsData[activeTeamId]) {
            allTeamsData[activeTeamId] = { name: `Tripulação ${activeTeamId}`, attempts: {}, currentMissionIndex: 0 };
        }
        teamNameInput.value = allTeamsData[activeTeamId].name; // Atualiza o input
        renderMission(allTeamsData[activeTeamId].currentMissionIndex);
    });

    // NOVO: Salva o nome da equipe
    teamNameSaveButton.addEventListener('click', () => {
        const newName = teamNameInput.value.trim();
        if (newName === "") return; // Não permite nomes em branco

        // 1. Salva o nome no objeto de dados
        allTeamsData[activeTeamId].name = newName;

        // 2. Atualiza o texto na lista <select>
        const option = teamSelectEl.querySelector(`option[value="${activeTeamId}"]`);
        if (option) {
            option.textContent = newName;
        }
        
        // 3. Salva no localStorage
        saveProgress(); 

        // Feedback
        teamNameSaveButton.textContent = 'Salvo!';
        setTimeout(() => { teamNameSaveButton.textContent = 'Salvar Nome'; }, 1000);
    });


    // --- Inicialização ---
    loadProgress(); 
    activeTeamId = teamSelectEl.value; 
    
    if (!allTeamsData[activeTeamId] || typeof allTeamsData[activeTeamId].currentMissionIndex === 'undefined') {
        allTeamsData = initializeData();
        saveProgress();
    }

    // Define o valor inicial do input de nome
    teamNameInput.value = allTeamsData[activeTeamId].name;
    
    renderMission(allTeamsData[activeTeamId].currentMissionIndex); 
});
