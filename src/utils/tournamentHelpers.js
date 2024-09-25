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
    const playerA = shuffledPlayers[i];
    const playerB = shuffledPlayers[i + 1] || { name: 'Bye', isBye: true };

    const matchup = {
      players: [playerA, playerB],
      result: null,
      matchNumber: matchups.length + 1
    };

    if (playerB.isBye) {
      matchup.result = 1;
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

export function updateResult(matchup, result, bestOfThree = false) {
  const playerA = matchup.players[0];
  const playerB = matchup.players[1];

  if (!bestOfThree) {
    matchup.result = result;
    if (result === 1) {
      playerA.wins++;
      playerB.losses++;
    } else if (result === 2) {
      playerB.wins++;
      playerA.losses++;
    }
  } else {
    matchup.result = result; // Result is expected to be { playerAWins: X, playerBWins: Y }

    const matchOutcome = `${result.playerAWins}-${result.playerBWins}`;

    switch (matchOutcome) {
      case '2-0':
        playerA.score += 3;
        playerA.wins++;
        playerB.losses++;
        break;

      case '0-2':
        playerB.score += 3;
        playerB.wins++;
        playerA.losses++;
        break;

      case '2-1':
        playerA.score += 2;
        playerB.score += 1;
        playerA.wins++;
        playerB.losses++;
        break;

      case '1-2':
        playerB.score += 2;
        playerA.score += 1;
        playerB.wins++;
        playerA.losses++;
        break;

      case '1-1':
        playerA.ties++;
        playerB.ties++;
        playerA.score += 1;
        playerB.score += 1;
        break;

      default:
        debugLog('Unexpected result:', result);
    }
  }

  debugLog('Updated result for matchup:', matchup, 'with result:', result);
}

export function modifyResult(matchup) {
  matchup.result = null;
  debugLog('Modified result for matchup, reset:', matchup);
}

export function saveTournamentData(players, rounds, tournamentStarted, currentRound, tournamentType, bestOfThree) {
  const tournamentData = {
    players,
    rounds,
    tournamentStarted,
    currentRound,
    tournamentType,
    bestOfThree
  };
  localStorage.setItem('tournamentData', JSON.stringify(tournamentData));
  debugLog('Saved tournament data:', tournamentData);
}

export function loadTournamentData() {
  const data = localStorage.getItem('tournamentData');
  if (data) {
    const tournamentData = JSON.parse(data);
    return {
      ...tournamentData,
      bestOfThree: tournamentData.bestOfThree || false // Ensure bestOfThree is loaded, default to false if missing
    };
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
            bestOfThree: jsonData.bestOfThree || false
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