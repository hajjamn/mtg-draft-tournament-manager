<script>
import { debugLog } from '../utils/debugHelpers';

export default {
  props: {
    matchups: Array,
    roundIndex: Number,
    tournamentType: String
  },
  methods: {
    updateResult(matchIndex, result) {
      this.$emit('updateResult', this.roundIndex, matchIndex, result);
      debugLog('The arguments that the MathcupDisplay component is passing are: ', this.roundIndex, matchIndex, result)
    },
    modifyResult(matchIndex) {
      this.$emit('modifyResult', this.roundIndex, matchIndex);
    }
  }
};
</script>

<template>
  <ul>
    <li v-for="(matchup, matchIndex) in matchups" :key="matchIndex">
      Match {{ matchIndex + 1 }}: {{ matchup.players[0].name }} vs {{ matchup.players[1].name }}
      <div v-if="matchup.result === null">
        <button @click="updateResult(matchIndex, 1)" class="btn btn-success">Win for {{ matchup.players[0].name
          }}</button>
        <button @click="updateResult(matchIndex, 2)" class="btn btn-success">Win for {{ matchup.players[1].name
          }}</button>
        <button v-if="tournamentType === 'round-robin'" @click="updateResult(matchIndex, 0)"
          class="btn btn-secondary">Draw</button>
      </div>
      <div v-else>
        <button @click="modifyResult(matchIndex)" class="btn btn-warning">Modify Result</button>
      </div>
    </li>
  </ul>
</template>
