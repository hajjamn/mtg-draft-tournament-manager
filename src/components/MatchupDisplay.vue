<script>
import { debugLog } from '../utils/debugHelpers'; // Import debugLog

export default {
  props: {
    matchups: Array,
    roundIndex: Number,
    tournamentType: String,
    bestOfThree: Boolean
  },
  data() {
    return {
      bo3Results: this.matchups.map(() => ({
        player1Wins: 0,
        player2Wins: 0,
        errorMessage: ''
      }))
    };
  },
  methods: {
    updateResult(matchIndex, result) {
      debugLog(`Updating result for matchIndex ${matchIndex} in Best-of-1 mode. Result:`, result);
      this.$emit('updateResult', this.roundIndex, matchIndex, result);
    },
    modifyResult(matchIndex) {
      debugLog(`Modifying result for matchIndex ${matchIndex}`);
      this.$emit('modifyResult', this.roundIndex, matchIndex);
    },
    submitBo3Result(matchIndex) {
      const result = this.bo3Results[matchIndex];
      debugLog(`Submitting Bo3 result for matchIndex ${matchIndex}. Player 1 Wins: ${result.player1Wins}, Player 2 Wins: ${result.player2Wins}`);

      const totalWins = result.player1Wins + result.player2Wins;

      if (totalWins < 2) {
        result.errorMessage = 'The number of wins is lower than expected. The total wins must be at least 2.';
        debugLog(`Invalid result for matchIndex ${matchIndex}: Total wins is ${totalWins}, which is too low.`);
        return;
      }

      if (totalWins > 3) {
        result.errorMessage = 'The number of wins exceeds the maximum allowed. The total wins cannot exceed 3.';
        debugLog(`Invalid result for matchIndex ${matchIndex}: Total wins is ${totalWins}, which is too high.`);
        return;
      }
      
      result.errorMessage = '';
      debugLog(`Valid result for matchIndex ${matchIndex}: Submitting Bo3 result.`);
      this.$emit('updateResult', this.roundIndex, matchIndex, { player1Wins: result.player1Wins, player2Wins: result.player2Wins });
    }
  },
  mounted() {
    debugLog('MatchupDisplay mounted. Best-of-Three mode is', this.bestOfThree);
  }
};
</script>

<template>
  <ul>
    <li v-for="(matchup, matchIndex) in matchups" :key="matchIndex">
      Match {{ matchIndex + 1 }}: {{ matchup.players[0].name }} vs {{ matchup.players[1].name }}

      <!-- Best-of-1 Input -->
      <div v-if="!bestOfThree && matchup.result === null">
        <button @click="updateResult(matchIndex, 1)" class="btn btn-success">Win for {{ matchup.players[0].name
          }}</button>
        <button @click="updateResult(matchIndex, 2)" class="btn btn-success">Win for {{ matchup.players[1].name
          }}</button>
      </div>

      <!-- Best-of-3 Input -->
      <div v-else-if="bestOfThree && matchup.result === null">
        <label>Wins for {{ matchup.players[0].name }}:</label>
        <input type="number" v-model="bo3Results[matchIndex].player1Wins" min="0" max="2" />

        <label>Wins for {{ matchup.players[1].name }}:</label>
        <input type="number" v-model="bo3Results[matchIndex].player2Wins" min="0" max="2" />

        <!-- Error message display -->
        <div v-if="bo3Results[matchIndex].errorMessage" class="text-danger">{{ bo3Results[matchIndex].errorMessage }}</div>

        <button @click="submitBo3Result(matchIndex)" class="btn btn-success">Submit Result</button>
      </div>

      <div v-else>
        <button @click="modifyResult(matchIndex)" class="btn btn-warning">Modify Result</button>
      </div>
    </li>
  </ul>
</template>

<style scoped>
ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin-bottom: 10px;
}

.text-danger {
  color: red;
}
</style>
