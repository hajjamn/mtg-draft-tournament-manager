<script>
export default {
  props: {
    players: Array,
    tournamentType: String,
    bestOfThree: Boolean
  },
  computed: {
    sortedPlayers() {
      return [...this.players].sort((a, b) => {
        // 1. Sort by score if it's round-robin best-of-3
        if (this.bestOfThree && this.tournamentType === 'round-robin') {
          if (b.score !== a.score) return b.score - a.score;
        }

        // 2. Sort by wins if no score
        if (b.wins !== a.wins) return b.wins - a.wins;

        // 3. Sort by losses (fewer losses is better)
        if (a.losses !== b.losses) return a.losses - b.losses;

        // 4. Sort alphabetically in case of tie
        return a.name.localeCompare(b.name);
      });
    }
  }
};
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>Player</th>
        <th v-if="bestOfThree && tournamentType === 'round-robin'">Score</th>
        <th>Wins</th>
        <th>Losses</th>
        <th>Ties</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="player in sortedPlayers" :key="player.name">
        <td>{{ player.name }}</td>
        <td v-if="bestOfThree && tournamentType === 'round-robin'">{{ player.score }}</td>
        <td>{{ player.wins }}</td>
        <td>{{ player.losses }}</td>
        <td>{{ player.ties }}</td>
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
