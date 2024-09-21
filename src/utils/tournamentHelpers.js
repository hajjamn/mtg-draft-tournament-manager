export function randomizeMatchups(players, tournamentType) {
  if (tournamentType === 'single-elimination') {
    return singleElimination(players);
  } else if (tournamentType === 'double-elimination') {
    // Double elimination logic will be handled later
    return singleElimination(players); // Placeholder for now
  } else if (tournamentType === 'round-robin') {
    return roundRobin(players);
  }
}

function singleElimination(players) {
  const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
  const matchups = [];
  for (let i = 0; i < shuffledPlayers.length; i += 2) {
    const player1 = shuffledPlayers[i];
    const player2 = shuffledPlayers[i + 1] || { name: 'Bye', score: 0, isBye: true }; // Mark Bye player

    const matchup = {
      players: [player1, player2],
      result: null,
      matchNumber: matchups.length + 1
    };

    if (player2.isBye) {
      player1.score += 3; // Player 1 gets 3 points for Bye
      matchup.result = 1;  // Mark the result for Player 1 win
    }

    matchups.push(matchup);
  }
  return matchups;
}

// Helper function for Round Robin
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
  return matchups;
}

export function updateScore(matchup, result, currentRoundIndex, totalRounds, tournamentType) {
  if (matchup.result !== null) return; // Only update if result hasn't been decided

  const winner = result === 1 ? matchup.players[0] : matchup.players[1];
  const loser = result === 1 ? matchup.players[1] : matchup.players[0];

  if (tournamentType === 'round-robin') {
    // Round-robin logic: only update scores, no placements
    if (result === 1) {
      winner.score += 3; // Player 1 wins
    } else if (result === 2) {
      loser.score += 3; // Player 2 wins
    } else if (result === 0) {
      matchup.players[0].score += 1; // Draw
      matchup.players[1].score += 1;
    }
  } else {
    // Single-elimination logic: update scores and assign placements
    if (result === 1 || result === 2) {
      winner.score += 3;
    } else if (result === 0) {
      matchup.players[0].score += 1;
      matchup.players[1].score += 1;
    }

    // Assign placements for single elimination
    if (currentRoundIndex === totalRounds - 1) {
      // Final match
      winner.placement = 1; // First place
      loser.placement = 2;   // Second place
      console.log(`Final match: ${winner.name} is 1st, ${loser.name} is 2nd`);
    } else if (currentRoundIndex === totalRounds - 2) {
      // Semi-finals: assign winners to finals and losers to third-place match
      // Push a third-place match for the semi-final losers
      const thirdPlaceMatch = {
        players: [loser, winner.isBye ? winner : matchup.players[1]], // Ensure there's no bye
        result: null,
        matchNumber: 1,
      };
      loser.placement = 4; // Placeholder, later to be decided after third-place match
      console.log(`Third-place match setup: ${loser.name} vs ${winner.name}`);
    } else {
      // All other rounds
      const tiedPlace = Math.pow(2, totalRounds - currentRoundIndex - 1) + 1; // Correct, calculates 5th place
      loser.placement = tiedPlace;
      console.log(`Earlier round: ${loser.name} ties for ${tiedPlace}th place`);
    }
  }

  matchup.result = result;
}

export function modifyResult(matchup) {
  if (matchup.result === 1) {
    matchup.players[0].score -= 3; // Rollback Player 1 win
  } else if (matchup.result === 2) {
    matchup.players[1].score -= 3; // Rollback Player 2 win
  } else if (matchup.result === 0) {
    matchup.players[0].score -= 1; // Rollback draw
    matchup.players[1].score -= 1;
  }
  matchup.result = null;
}

// Updated helper function to calculate tied place based on number of remaining players and current round
export function calculateTiedPlace(totalPlayers, currentRoundIndex) {
  const totalRounds = Math.ceil(Math.log2(totalPlayers)); // Total rounds in tournament
  const remainingPlayers = Math.pow(2, totalRounds - currentRoundIndex); // Players still in the tournament
  return remainingPlayers + 1; // Tied place for the losers
}

// Helper function to create and download JSON file
export function createJSONFile(tournamentData) {
  const json = JSON.stringify(tournamentData, null, 2); // Pretty-printed JSON
  const blob = new Blob([json], { type: 'application/json' }); // Create Blob from JSON data
  const link = document.createElement('a'); // Create <a> element
  link.href = URL.createObjectURL(blob); // Create Object URL for the Blob
  link.download = 'tournament-data.json'; // Set file name
  link.click(); // Trigger the download by clicking the link programmatically
}
