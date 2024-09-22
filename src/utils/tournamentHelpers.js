import { debugLog } from './debugHelpers'; // Import debugLog

export function randomizeMatchups(players, tournamentType) {
  debugLog('Randomizing matchups for tournament type:', tournamentType, 'with players:', players);

  if (tournamentType === 'single-elimination') {
    return singleElimination(players);
  } else if (tournamentType === 'round-robin') {
    return roundRobin(players);
  }
}

function singleElimination(players) {
  const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
  const matchups = [];
  for (let i = 0; i < shuffledPlayers.length; i += 2) {
    const player1 = shuffledPlayers[i];
    const player2 = shuffledPlayers[i + 1] || { name: 'Bye', isBye: true };

    const matchup = {
      players: [player1, player2],
      result: null,
      matchNumber: matchups.length + 1
    };

    if (player2.isBye) {
      matchup.result = 1;  // Player 1 wins by default
    }

    matchups.push(matchup);
  }
  debugLog('Generated single elimination matchups:', matchups);
  return matchups;
}

function roundRobin(players) {
  const matchups = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matchups.push({
        players: [players[i], players[j]],
        result: null,
        matchNumber: matchups.length + 1
      });
    }
  }
  debugLog('Generated round robin matchups:', matchups);
  return matchups;
}

export function updateResult(matchup, result) {
  if (matchup.result !== null) return;
  matchup.result = result;
  debugLog('Updated result for matchup:', matchup, 'with result:', result);
}

export function modifyResult(matchup) {
  matchup.result = null;
  debugLog('Modified result for matchup, reset:', matchup);
}

export function saveTournamentData(players, rounds, tournamentStarted, currentRound, tournamentType) {
  const tournamentData = {
    players,
    rounds,
    tournamentStarted,
    currentRound,
    tournamentType
  };
  localStorage.setItem('tournamentData', JSON.stringify(tournamentData));
  debugLog('Saved tournament data:', tournamentData);
}

export function loadTournamentData() {
  const data = localStorage.getItem('tournamentData');
  if (data) {
    const tournamentData = JSON.parse(data);
    return tournamentData;
  }
  return null;
}

export function createJSONFile(tournamentData) {
  const json = JSON.stringify(tournamentData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'tournament-data.json';
  link.click();
}

export async function processUploadedFile(file) {
  if (file) {
    try {
      const fileContent = await file.text();
      const jsonData = JSON.parse(fileContent);

      if (jsonData.players && jsonData.rounds && jsonData.currentRound !== undefined) {
        return {
          success: true,
          data: {
            players: jsonData.players,
            rounds: jsonData.rounds,
            currentRound: jsonData.currentRound,
            tournamentStarted: jsonData.tournamentStarted,
          },
        };
      } else {
        return {
          success: false,
          message: 'Invalid JSON structure',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error parsing the JSON file',
      };
    }
  }
}