<script>
import PlayerInput from '../components/PlayerInput.vue';
import MatchupDisplay from '../components/MatchupDisplay.vue';
import PlayerStandings from '../components/PlayerStandings.vue';
import ClearDataModal from '../components/ClearDataModal.vue';
import { randomizeMatchups, updateScore, modifyResult, createJSONFile } from '../utils/tournamentHelpers.js';

export default {
  components: {
    PlayerInput,
    MatchupDisplay,
    PlayerStandings,
    ClearDataModal
  },
  data() {
    return {
      numPlayers: 4, // Default number of players is 4
      players: [],
      tournamentStarted: false,
      rounds: [],
      currentRound: 1,
      showModal: false,
      validationPassed: false,
      uploadError: '' // Error message for file validation
    };
  },
  methods: {
    initializePlayers() {
      this.players = Array.from({ length: this.numPlayers }, () => ({
        name: '',
        score: 0
      }));
    },
    startTournament() {
      this.$refs.playerInput.validatePlayers();
      if (this.validationPassed) {
        this.tournamentStarted = true;
        this.rounds.push({ roundNumber: this.currentRound, matchups: randomizeMatchups(this.players) });
        this.saveData();
      }
    },
    updateScore(matchup, result, roundIndex, matchIndex) {
      updateScore(this.rounds[roundIndex].matchups[matchIndex], result); // Use helper
      this.checkForNextRound();
      this.saveData();
    },
    checkForNextRound() {
      const allDecided = this.rounds[this.currentRound - 1].matchups.every(match => match.result !== null);

      if (allDecided) {
        const winners = this.rounds[this.currentRound - 1].matchups
          .filter(match => match.result === 1 || match.result === 2)
          .map(match => match.players[match.result - 1]);

        const losers = this.rounds[this.currentRound - 1].matchups
          .filter(match => match.result === 1 || match.result === 2)
          .map(match => match.players[match.result === 1 ? 1 : 0]);

        const nextRound = [
          { players: [winners[0], winners[1]], result: null, matchNumber: 1 },
          { players: [losers[0], losers[1]], result: null, matchNumber: 2 }
        ];

        this.rounds.push({ roundNumber: ++this.currentRound, matchups: nextRound });
        this.saveData();
      }
    },
    modifyResult(matchup, roundIndex, matchIndex) {
      modifyResult(this.rounds[roundIndex].matchups[matchIndex]); // Use helper
      this.resetNextRounds();
      this.saveData();
    },
    resetNextRounds() {
      this.rounds = this.rounds.slice(0, this.currentRound);
    },
    clearData() {
      this.showModal = true;
    },
    confirmClear() {
      localStorage.removeItem('tournamentData');
      location.reload();
    },
    saveData() {
      const tournamentData = {
        players: this.players,
        rounds: this.rounds,
        tournamentStarted: this.tournamentStarted,
        currentRound: this.currentRound
      };
      localStorage.setItem('tournamentData', JSON.stringify(tournamentData));
    },
    loadData() {
      const data = localStorage.getItem('tournamentData');
      if (data) {
        const tournamentData = JSON.parse(data);
        this.players = tournamentData.players;
        this.rounds = tournamentData.rounds;
        this.tournamentStarted = tournamentData.tournamentStarted;
        this.currentRound = tournamentData.currentRound;
      }
    },
    handleValidation(passed) {
      this.validationPassed = passed;
    },
    downloadJSON() {
      const tournamentData = {
        players: this.players,
        rounds: this.rounds,
        tournamentStarted: this.tournamentStarted,
        currentRound: this.currentRound
      };
      createJSONFile(tournamentData); // Use helper function for JSON download
    },
    // Mark the function as async to use await
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        try {
          const fileContent = await file.text(); // Use await here
          const jsonData = JSON.parse(fileContent);
          if (jsonData.players && jsonData.rounds && jsonData.currentRound !== undefined) {
            this.players = jsonData.players;
            this.rounds = jsonData.rounds;
            this.currentRound = jsonData.currentRound;
            this.tournamentStarted = jsonData.tournamentStarted;
            this.uploadError = '';
          } else {
            this.uploadError = 'Invalid JSON structure';
          }
        } catch (error) {
          this.uploadError = 'Error parsing the JSON file';
        }
      }
    }
  },
  mounted() {
    this.loadData();
  }
};
</script>

<template>
  <main class="app-content">
    <div class="overlay">
      <div class="container">
        <!-- Input for Number of Players -->
        <div v-if="!tournamentStarted" class="mb-3">
          <label for="numPlayers">Number of Players</label>
          <input type="number" v-model="numPlayers" @input="initializePlayers" class="form-control" min="2" max="16" />
        </div>

        <!-- Player Input Fields -->
        <form @submit.prevent="startTournament" v-if="!tournamentStarted">
          <PlayerInput ref="playerInput" :players="players" @validatePlayers="handleValidation" />
          <button type="submit" class="btn btn-primary">Start Tournament</button>
        </form>

        <!-- Matchup Display and Player Standings -->
        <div v-if="tournamentStarted" class="mt-5">
          <div v-for="(round, roundIndex) in rounds" :key="round.roundNumber" class="mt-5">
            <h3>Round {{ round.roundNumber }}</h3> <!-- Round Number -->
            <MatchupDisplay :matchups="round.matchups" @updateScore="updateScore" @modifyResult="modifyResult"
              :roundIndex="roundIndex" />
          </div>

          <!-- Player Standings Section -->
          <PlayerStandings :players="players" />

          <!-- Buttons to Download Data and Clear Data -->
          <div class="mt-4">
            <button type="button" class="btn btn-primary" @click="downloadJSON">
              Download Tournament Data
            </button>
            <button type="button" class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#clearDataModal">
              Clear Tournament Data
            </button>
          </div>
        </div>

        <!-- File input for JSON upload -->
        <div class="mt-4">
          <label for="fileUpload">Upload Tournament Data (JSON)</label>
          <input type="file" id="fileUpload" @change="handleFileUpload" accept=".json" />
          <div v-if="uploadError" class="text-danger">{{ uploadError }}</div> <!-- Display error if any -->
        </div>

      </div>
    </div>

    <!-- Clear Data Modal Component -->
    <ClearDataModal :showModal="showModal" @confirmClear="confirmClear" />
  </main>
</template>

<style scoped>
.app-content {
  background: url('/duskmourn-wallpaper.webp') no-repeat top center fixed;
  background-size: cover;
  position: relative;
  overflow: hidden;
}

.overlay {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  height: 100%;
  padding: 20px;
  overflow: auto;
}

h2,
h3 {
  color: #fff;
}

li {
  color: #ddd;
}
</style>