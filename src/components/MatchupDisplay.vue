<script>
export default {
  props: {
    matchups: Array,
    roundIndex: Number
  },
  methods: {
    updateScore(matchup, result, matchIndex) {
      this.$emit('updateScore', matchup, result, this.roundIndex, matchIndex); // Pass the roundIndex and matchIndex
    },
    modifyResult(matchup, matchIndex) {
      this.$emit('modifyResult', matchup, this.roundIndex, matchIndex); // Pass the roundIndex and matchIndex
    }
  }
};
</script>

<template>
  <ul>
    <li v-for="(matchup, index) in matchups" :key="index">
      Match {{ index + 1 }}: {{ matchup.players[0].name }} vs {{ matchup.players[1].name }}
      <div v-if="matchup.result === null">
        <button @click="updateScore(matchup, 1, index)" class="btn btn-success">Win for {{ matchup.players[0].name
          }}</button>
        <button @click="updateScore(matchup, 2, index)" class="btn btn-success">Win for {{ matchup.players[1].name
          }}</button>
        <button @click="updateScore(matchup, 0, index)" class="btn btn-secondary">Draw</button>
      </div>
      <div v-else>
        <button @click="modifyResult(matchup, index)" class="btn btn-warning">Modify Result</button>
      </div>
    </li>
  </ul>
</template>

<style scoped></style>
