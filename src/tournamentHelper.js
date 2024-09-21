// tournamentHelper.js
export function randomizeMatchups(players) {
  const shuffledPlayers = [...players].sort(() => 0.5 - Math.random()); // Shuffle players
  const matchups = [];
  for (let i = 0; i < shuffledPlayers.length; i += 2) {
    const player1 = shuffledPlayers[i];
    const player2 = shuffledPlayers[i + 1] || { name: 'Bye', score: 0 }; // Create Bye if no pair
    matchups.push({
      players: [player1, player2],
      result: null,
      matchNumber: matchups.length + 1
    });
  }
  return matchups;
}

export function updateScore(matchup, result) {
  if (matchup.result !== null) return; // Only update if result hasn't been decided
  if (result === 1) {
    matchup.players[0].score += 3; // Player 1 wins
  } else if (result === 2) {
    matchup.players[1].score += 3; // Player 2 wins
  } else if (result === 0) {
    matchup.players[0].score += 1; // Draw
    matchup.players[1].score += 1;
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
