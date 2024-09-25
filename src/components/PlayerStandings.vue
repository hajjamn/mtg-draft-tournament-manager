<script>
export default {
  props: {
    sortedPlayers: Array,
    tournamentType: String,
    bestOfThree: Boolean,
  },
};
</script>

<template>
  <table class="text-center">
    <thead>
      <tr>
        <th>Player</th>
        <th v-if="tournamentType === 'round-robin'">Score</th>
        <th>Wins</th>
        <th>Losses</th>
        <th v-if="tournamentType === 'round-robin' && bestOfThree">Ties</th>
        <!-- Ties only in Bo3 -->
      </tr>
    </thead>
    <tbody>
      <tr v-for="(player, index) in sortedPlayers" :key="index">
        <td>{{ player.name }}</td>
        <td v-if="tournamentType === 'round-robin'">
          {{ player.score ?? "-" }}
        </td>
        <td>{{ player.wins }}</td>
        <td>{{ player.losses }}</td>
        <td v-if="tournamentType === 'round-robin' && bestOfThree">
          {{ player.ties ?? "-" }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
