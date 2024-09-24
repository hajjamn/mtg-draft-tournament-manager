<script>
import { debugLog } from '../utils/debugHelpers';
export default {
  props: {
    players: Array,
    tournamentType: String,
    bestOfThree: Boolean,
    rounds: Array
  },
  computed: {
    sortedPlayers() {
      return [...this.players].sort((a, b) => {

        if (this.tournamentType === "round-robin" && a.score !== undefined && b.score !== undefined) {
          if (a.score === b.score) {
            if (a.wins === b.wins) {
              if (a.losses === b.losses) {
                const headToHead = this.checkHeadToHead(a, b);
                if (headToHead !== 0) return headToHead;

                return a.name.localeCompare(b.name);
              }
              return a.losses - b.losses;
            }
            return b.wins - a.wins;
          }
          return b.score - a.score;
        } else {

          if (a.wins === b.wins) {
            if (a.losses === b.losses) {
              return a.name.localeCompare(b.name);
            }
            return a.losses - b.losses;
          }
          return b.wins - a.wins;
        }
      });
    }
  },
  methods: {
    checkHeadToHead(playerA, playerB) {
  const matchBetween = this.rounds
    .flatMap(round => round.matchups)
    .find(
      match => match.players.includes(playerA) && match.players.includes(playerB)
    );

  if (!matchBetween) {
    debugLog(`No match found between ${playerA.name} and ${playerB.name}.`);
    return 0; // No match between them, can't determine head-to-head
  }

  debugLog(`Found match between players:`, matchBetween);

  if (matchBetween.result === 1) {
    // Player A (listed as the first player) won
    debugLog(`Player A (${playerA.name}) won the head-to-head match against Player B (${playerB.name})`);
    return -1; // Player A goes first
  } else if (matchBetween.result === 2) {
    // Player B (listed as the second player) won
    debugLog(`Player B (${playerB.name}) won the head-to-head match against Player A (${playerA.name})`);
    return 1; // Player B goes first
  }

  debugLog(`Head-to-head match between ${playerA.name} and ${playerB.name} is tied`);
  return 0; // The match was a tie or undecided
}
  }
};
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>Player</th>
        <th v-if="tournamentType === 'round-robin'">Score</th>
        <th>Wins</th>
        <th>Losses</th>
        <th v-if="tournamentType === 'round-robin' && bestOfThree">Ties</th> <!-- Ties only in Bo3 -->
      </tr>
    </thead>
    <tbody>
      <tr v-for="(player, index) in sortedPlayers.slice(0, 4)" :key="index">
        <td>{{ player.name }}</td>
        <td v-if="tournamentType === 'round-robin'">{{ player.score ?? '-' }}</td>
        <td>{{ player.wins }}</td>
        <td>{{ player.losses }}</td>
        <td v-if="tournamentType === 'round-robin' && bestOfThree">{{ player.ties ?? '-' }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}
</style>
