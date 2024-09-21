<script>
export default {
  props: {
    players: Array
  },
  computed: {
    sortedPlayers() {
      return [...this.players].sort((a, b) => b.score - a.score);
    }
  }
};
</script>

<template>
  <div>
    <h3 class="mt-5">Player Standings:</h3>
    <ul>
      <li v-for="(player, index) in sortedPlayers" :key="index">
        {{ player.name }} - {{ player.score }} points
      </li>
    </ul>
  </div>
</template>

<style scoped></style>
