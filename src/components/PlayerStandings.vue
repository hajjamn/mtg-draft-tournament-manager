<script>
export default {
  props: {
    players: Array,
    tournamentType: String,
    rounds: Array // Added rounds prop to calculate final standings for single elimination
  },
  computed: {
    sortedPlayers() {
      return [...this.players]
        .filter(player => player.placement !== null) // Only show players with assigned placements
        .sort((a, b) => a.placement - b.placement); // Sort by placement
    }
  }
};
</script>

<template>
  <div>
    <h3>Player Standings:</h3>

    <!-- Display sorted standings for both single elimination and round-robin -->
    <ul v-if="sortedPlayers.length > 0">
      <li v-for="(player, index) in sortedPlayers" :key="index">
        {{ player.placement }}: {{ player.name }}
      </li>
    </ul>

    <p v-if="sortedPlayers.length === 0">No standings available yet.</p>
  </div>
</template>

<style scoped>
ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 5px 0;
}
</style>
