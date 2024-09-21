<script>
import PlayerInput from '../components/PlayerInput.vue';
import MatchupDisplay from '../components/MatchupDisplay.vue';
import PlayerStandings from '../components/PlayerStandings.vue';
import ClearDataModal from '../components/ClearDataModal.vue';
import { randomizeMatchups, createJSONFile } from '../utils/tournamentHelpers.js'; // Updated import

export default {
  components: {
    PlayerInput,
    MatchupDisplay,
    PlayerStandings,
    ClearDataModal
  },
  data() {
    return {
      players: [
        { name: '', score: 0 },
        { name: '', score: 0 },
        { name: '', score: 0 },
        { name: '', score: 0 }
      ],
      tournamentStarted: false,
      rounds: [],
      currentRound: 1,
      showModal: false,
      validationPassed: false,
      uploadError: '' // Error message for file validation
    };
  },
  methods: {
    startTournament() {
      this.$refs.playerInput.validatePlayers();
      if (this.validationPassed) {
        this.tournamentStarted = true;
        this.rounds.push({ roundNumber: this.currentRound, matchups: randomizeMatchups(this.players) });
        this.saveData();
      }
    },
    updateScore(matchup, result, roundIndex, matchIndex) {
      if (this.rounds[roundIndex].matchups[matchIndex].result !== null) return;

      if (result === 1) {
        this.rounds[roundIndex].matchups[matchIndex].players[0].score += 3;
      } else if (result === 2) {
        this.rounds[roundIndex].matchups[matchIndex].players[1].score += 3;
      } else if (result === 0) {
        this.rounds[roundIndex].matchups[matchIndex].players[0].score += 1;
        this.rounds[roundIndex].matchups[matchIndex].players[1].score += 1;
      }

      this.rounds[roundIndex].matchups[matchIndex].result = result;
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
      const currentMatchup = this.rounds[roundIndex].matchups[matchIndex];

      if (currentMatchup.result === 1) {
        currentMatchup.players[0].score -= 3;
      } else if (currentMatchup.result === 2) {
        currentMatchup.players[1].score -= 3;
      } else if (currentMatchup.result === 0) {
        currentMatchup.players[0].score -= 1;
        currentMatchup.players[1].score -= 1;
      }

      currentMatchup.result = null;
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
    // New method for file upload
    async handleFileUpload(event) {
      const file = event.target.files[0]; // Get the file from input
      if (file) {
        try {
          const fileContent = await file.text(); // Read the file content
          const jsonData = JSON.parse(fileContent); // Parse it as JSON

          // Basic validation
          if (jsonData.players && jsonData.rounds && jsonData.currentRound !== undefined) {
            this.players = jsonData.players; // Load players
            this.rounds = jsonData.rounds; // Load rounds
            this.currentRound = jsonData.currentRound; // Load current round
            this.tournamentStarted = jsonData.tournamentStarted; // Load tournament state
            this.uploadError = ''; // Clear any previous error
          } else {
            this.uploadError = 'Invalid JSON structure'; // Error message for invalid JSON
          }
        } catch (error) {
          this.uploadError = 'Error parsing the JSON file'; // Error message if JSON parsing fails
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
        <form @submit.prevent="startTournament" v-if="!tournamentStarted">
          <PlayerInput ref="playerInput" :players="players" @validatePlayers="handleValidation" />
          <button type="submit" class="btn btn-primary">Start Tournament</button>
        </form>

        <div v-if="tournamentStarted" class="mt-5">
          <div v-for="(round, roundIndex) in rounds" :key="round.roundNumber" class="mt-5">
            <h3>Round {{ round.roundNumber }}</h3>
            <MatchupDisplay :matchups="round.matchups" @updateScore="updateScore" @modifyResult="modifyResult"
              :roundIndex="roundIndex" />
          </div>

          <PlayerStandings :players="players" />

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
