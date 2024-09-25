<script>
import { debugLog } from "../utils/debugHelpers"; // Import debugLog

export default {
  props: {
    matchups: Array,
    roundIndex: Number,
    tournamentType: String,
    bestOfThree: Boolean,
  },
  data() {
    return {
      bo3Results: this.matchups.map(() => ({
        playerAWins: 0,
        playerBWins: 0,
        errorMessage: "",
      })),
    };
  },
  methods: {
    validateBo3Results(matchIndex) {
      const result = this.bo3Results[matchIndex];
      const totalWins = result.playerAWins + result.playerBWins;

      if (totalWins < 2 || totalWins > 3) {
        result.errorMessage = `Invalid result: Total wins for Match ${
          matchIndex + 1
        } must be between 2 and 3.`;
        debugLog(
          `Invalid result for matchIndex ${matchIndex}: Total wins is ${totalWins}.`
        );
        return;
      }

      result.errorMessage = "";
      this.submitResult(matchIndex, {
        playerAWins: result.playerAWins,
        playerBWins: result.playerBWins,
      });
    },
    submitResult(matchIndex, matchResult) {
      debugLog(
        `Emitting validated result for matchIndex ${matchIndex}:`,
        matchResult
      );
      this.$emit("submitResult", this.roundIndex, matchIndex, matchResult);
    },
    modifyResult(matchIndex) {
      debugLog(`Modifying result for matchIndex ${matchIndex}`);
      this.$emit("modifyResult", this.roundIndex, matchIndex);
    },
  },
  mounted() {
    debugLog("MatchupDisplay mounted. Best-of-Three mode is", this.bestOfThree);
  },
};
</script>

<template>
  <ul>
    <li v-for="(matchup, matchIndex) in matchups" :key="matchIndex">
      Match {{ matchIndex + 1 }}: {{ matchup.players[0].name }} vs
      {{ matchup.players[1].name }}

      <!-- Best-of-1 Input -->
      <div v-if="!bestOfThree && matchup.result === null">
        <button @click="submitResult(matchIndex, 1)" class="btn btn-success">
          Win for {{ matchup.players[0].name }}
        </button>
        <button @click="submitResult(matchIndex, 2)" class="btn btn-success">
          Win for {{ matchup.players[1].name }}
        </button>
      </div>

      <!-- Best-of-3 Input -->
      <div v-else-if="bestOfThree && matchup.result === null">
        <label>Wins for {{ matchup.players[0].name }}:</label>
        <input
          type="number"
          v-model="bo3Results[matchIndex].playerAWins"
          min="0"
          max="2"
        />

        <label>Wins for {{ matchup.players[1].name }}:</label>
        <input
          type="number"
          v-model="bo3Results[matchIndex].playerBWins"
          min="0"
          max="2"
        />

        <!-- Error message display -->
        <div v-if="bo3Results[matchIndex].errorMessage" class="text-danger">
          {{ bo3Results[matchIndex].errorMessage }}
        </div>

        <button @click="validateBo3Results(matchIndex)" class="btn btn-success">
          Submit Result
        </button>
      </div>

      <!-- Modify Button once the result is submitted -->
      <div v-else>
        <button @click="modifyResult(matchIndex)" class="btn btn-warning">
          Modify Result
        </button>
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
