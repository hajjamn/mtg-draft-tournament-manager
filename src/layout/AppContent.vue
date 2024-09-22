<script>
import PlayerInput from '../components/PlayerInput.vue';
import MatchupDisplay from '../components/MatchupDisplay.vue';
import ClearDataModal from '../components/ClearDataModal.vue';
import { randomizeMatchups, updateResult, modifyResult, saveTournamentData, loadTournamentData, createJSONFile, processUploadedFile } from '../utils/tournamentHelpers.js';
import { debugLog } from '../utils/debugHelpers';

export default {
  components: {
    PlayerInput,
    MatchupDisplay,
    ClearDataModal
  },
  data() {
    return {
      numPlayers: Number,
      players: [],
      tournamentStarted: false,
      rounds: [],
      currentRound: 1,
      tournamentType: 'single-elimination',
      bestOfThree: false,
      showModal: false,
      validationPassed: false,
      uploadError: '',
      tournamentTypes: [
        { value: 'single-elimination', label: 'Single Elimination' },
        { value: 'round-robin', label: 'Round Robin' }
      ]
    };
  },
  methods: {
    initializePlayers() {
      this.players = Array.from({ length: this.numPlayers }, () => ({
        name: '',
        score: 0,
        wins: 0,
        ties: 0,
        losses: 0
      }));
    },
    startTournament() {
      this.players.forEach((player, index) => {
        if (!player.name.trim()) {
          player.name = `Player ${index + 1}`;
        }
      });

      this.$refs.playerInput.validatePlayers();

      if (this.validationPassed) {
        this.tournamentStarted = true;
        this.rounds.push({ roundNumber: this.currentRound, matchups: randomizeMatchups(this.players, this.tournamentType) });
        this.saveData();
      }
    },
    handleValidation(passed) {
      this.validationPassed = passed;
    },
    updateResult(roundIndex, matchIndex, result) {
      if (!this.rounds[roundIndex] || !this.rounds[roundIndex].matchups) return;
      updateResult(this.rounds[roundIndex].matchups[matchIndex], result);
      this.checkForNextRound();
      this.saveData();
    },
    checkForNextRound() {
      const allDecided = this.rounds[this.currentRound - 1].matchups.every(match => match.result !== null);

      if (allDecided) {
        if (this.tournamentType === 'round-robin') return;

        if (this.tournamentType === 'single-elimination') {
          const winners = this.rounds[this.currentRound - 1].matchups
            .filter(match => match.result === 1 || match.result === 2)
            .map(match => match.players[match.result - 1]);

          if (winners.length <= 1) return;

          const nextRound = randomizeMatchups(winners, this.tournamentType);
          this.rounds.push({ roundNumber: ++this.currentRound, matchups: nextRound });
          debugLog('The current round is now: ', this.currentRound)
          this.saveData();
        }
      }
    },
    modifyResult(roundIndex, matchIndex) {
      debugLog('Modifying result for roundIndex:', roundIndex, 'and matchIndex:', matchIndex);

      if (this.rounds[roundIndex] && this.rounds[roundIndex].matchups[matchIndex]) {
        debugLog('Matchup exists, modifying the result.');
        modifyResult(this.rounds[roundIndex].matchups[matchIndex]);
        this.resetNextRounds();
        this.checkForNextRound();
        this.saveData();
        debugLog('The current rounds array is: ', this.rounds)
      } else {
        debugLog('Attempted to modify a result in a non-existing round or match.');
      }
    },
    resetNextRounds() {
      debugLog('Resetting rounds after current round:', this.currentRound);

      this.rounds = [...this.rounds.slice(0, this.currentRound - 1)];

      this.currentRound--;
      debugLog('Current rounds after reset:', this.rounds);
    },
    clearData() {
      this.showModal = true;
    },
    confirmClear() {
      localStorage.removeItem('tournamentData');
      location.reload();
    },
    saveData() {
      saveTournamentData(
        this.players,
        this.rounds,
        this.tournamentStarted,
        this.currentRound,
        this.tournamentType
      );
    },
    loadData() {
      const data = localStorage.getItem('tournamentData');
      if (data) {
        const tournamentData = JSON.parse(data);
        this.players = tournamentData.players;
        this.rounds = tournamentData.rounds;
        this.tournamentStarted = tournamentData.tournamentStarted;
        this.currentRound = tournamentData.currentRound;
        this.tournamentType = tournamentData.tournamentType || 'single-elimination';
      }
    },
    downloadJSON() {
      const tournamentData = {
        players: this.players,
        rounds: this.rounds,
        tournamentStarted: this.tournamentStarted,
        currentRound: this.currentRound,
        tournamentType: this.tournamentType
      };
      createJSONFile(tournamentData);
    },
    async handleFileUpload(event) {
      const file = event.target.files[0];
      const result = await processUploadedFile(file); // Call the helper function

      if (result.success) {
        const { players, rounds, currentRound, tournamentStarted } = result.data;
        this.players = players;
        this.rounds = rounds;
        this.currentRound = currentRound;
        this.tournamentStarted = tournamentStarted;
        this.uploadError = '';
      } else {
        this.uploadError = result.message;
      }
    },
  },
  mounted() {
    const tournamentData = loadTournamentData();
    if (tournamentData) {
      this.players = tournamentData.players;
      this.rounds = tournamentData.rounds;
      this.tournamentStarted = tournamentData.tournamentStarted;
      this.currentRound = tournamentData.currentRound;
      this.tournamentType = tournamentData.tournamentType || 'single-elimination';
    }
  }
};
</script>

<template>
  <div class="overlay">
    <div class="container">
      <!-- Select Tournament Type -->
      <div v-if="!tournamentStarted" class="mb-3">
        <label for="tournamentType">Tournament Type</label>
        <select v-model="tournamentType" id="tournamentType" class="form-control">
          <option v-for="type in tournamentTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </div>

      <!-- Best of 1 / Best of 3 Toggle Switch -->
      <div v-if="!tournamentStarted" class="mb-3 toggle-switch">
        <label for="bestOfThree">Best of 1</label>
        <input type="checkbox" v-model="bestOfThree" id="bestOfThree" />
        <label class="slider" for="bestOfThree"></label>
        <label for="bestOfThree">Best of 3</label>
      </div>

      <!-- Input for Number of Players -->
      <div v-if="!tournamentStarted" class="mb-3">
        <label for="numPlayers">Number of Players</label>
        <input type="number" v-model="numPlayers" @input="initializePlayers" class="form-control" min="2" max="16"
          placeholder="3, 4, 5 etc..." />
      </div>

      <!-- Player Input Fields -->
      <form @submit.prevent="startTournament" v-if="!tournamentStarted">
        <PlayerInput ref="playerInput" :players="players" @validatePlayers="handleValidation" />
        <button type="submit" class="btn btn-primary">Start Tournament</button>
      </form>

      <!-- Matchup Display -->
      <div v-if="tournamentStarted" class="mt-5">
        <div v-for="(round, roundIndex) in rounds" :key="round.roundNumber" class="mt-5">
          <h3>Round {{ roundIndex + 1 }}</h3>
          <MatchupDisplay :matchups="round.matchups" :roundIndex="roundIndex" :tournamentType="tournamentType"
            @updateResult="updateResult" @modifyResult="modifyResult" />
        </div>

        <!-- Buttons to Download Data and Clear Data -->
        <div class="mt-4">
          <button type="button" class="btn btn-primary" @click="downloadJSON">Download Tournament Data</button>
          <button type="button" class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#clearDataModal">
            Clear Tournament Data
          </button>
        </div>
      </div>

      <!-- Clear Data Modal -->
      <ClearDataModal :showModal="showModal" @confirmClear="confirmClear" />

      <!-- File input for JSON upload -->
      <div class="mt-4">
        <label for="fileUpload">Upload Tournament Data (JSON)</label>
        <input type="file" id="fileUpload" @change="handleFileUpload" accept=".json" />
        <div v-if="uploadError" class="text-danger">{{ uploadError }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  flex-grow: 1;
  overflow: auto;
  padding: 20px;
}

h2,
h3 {
  color: #fff;
}

li {
  color: #ddd;
}

/* Toggle button */

.toggle-switch {
  display: flex;
  align-items: center;
}

.toggle-switch input {
  display: none;
}

.toggle-switch label {
  margin: 0 10px;
  font-size: 14px;
}

.toggle-switch .slider {
  position: relative;
  width: 50px;
  height: 25px;
  background-color: #ccc;
  border-radius: 25px;
  cursor: pointer;
  transition: background-color 0.4s ease;
}

.toggle-switch .slider:before {
  position: absolute;
  content: "";
  height: 21px;
  width: 21px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.4s ease;
}

input:checked+.slider {
  background-color: #4caf50;
}

input:checked+.slider:before {
  transform: translateX(25px);
}
</style>