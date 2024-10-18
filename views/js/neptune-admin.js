const boSeriesSelect = document.getElementById('bo_series');
const gameInputsContainer = document.getElementById('game_inputs'); 

async function fetchArenas() {
    const response = await fetch('/get-arenas');
    if (!response.ok) {throw new Error('Failed to fetch arenas');}
    return await response.json();
}

async function generateGameInputs(boSeries) {
  gameInputsContainer.innerHTML = ''; 

  const arenas = await fetchArenas();

  for (let i = 1; i <= boSeries; i++) {
    const gameInput = document.createElement('div');
    gameInput.classList.add('grid', 'grid-cols-2', 'gap-4');
    gameInput.innerHTML = `
      <div>
        <label for="game_${i}_home_score" class="block text-sm font-medium text-gray-700">Game ${i} HOME Score</label>
        <input type="number" id="game_${i}_home_score" name="game_${i}_home_score" class="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black">
      </div>
      <div>
        <label for="game_${i}_away_score" class="block text-sm font-medium text-gray-700">Game ${i} AWAY Score</label>
        <input type="number" id="game_${i}_away_score" name="game_${i}_away_score" class="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black">
      </div>
      <div>
        <label for="game_${i}_arena" class="block text-sm font-medium text-gray-700">Game ${i} Arena</label>
        <select id="game_${i}_arena" name="game_${i}_arena" class="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black">
          <option value="" disabled selected>Select Arena</option>
          ${arenas.map(arena => `<option value="${arena.id}">${arena.name}</option>`).join('')}
        </select>
      </div>
    `;
    gameInputsContainer.appendChild(gameInput);
  }
}

boSeriesSelect.addEventListener('change', (event) => {
  const boSeries = parseInt(event.target.value);
  generateGameInputs(boSeries); 
});

generateGameInputs(parseInt(boSeriesSelect.value));

//////////////////////////////////////////////////////////////////
const matchSeasonSelect = document.getElementById('match_season_no');
const weeksDropdown = document.getElementById('week_no');

async function generateWeekOptions(seasonId) {
  weeksDropdown.innerHTML = '<option value="" disabled selected>Select a Week</option>';
  console.log(seasonId);
  
  try {
    const response = await fetch(`/get-weeks/${seasonId}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    const numWeeks = data.num_weeks;

    for (let week = 1; week <= numWeeks; week++) {
      const option = document.createElement('option');
      option.value = week;
      option.textContent = week;
      weeksDropdown.appendChild(option);
    }
  } catch (error) {
    console.error('Error fetching weeks:', error);
  }
}

matchSeasonSelect.addEventListener('change', (event) => {
  const selectedSeason = event.target.value;
  generateWeekOptions(selectedSeason); 
});

generateWeekOptions(matchSeasonSelect.value);
