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
      numPlayers: Number,
      players: [],
      tournamentStarted: false,
      rounds: [],
      currentRound: 1,
      showModal: false,
      validationPassed: false,
      uploadError: '',
      tournamentType: 'single-elimination', // Default tournament type
      tournamentTypes: [
        { value: 'single-elimination', label: 'Single Elimination' },
        { value: 'double-elimination', label: 'Double Elimination' },
        { value: 'round-robin', label: 'Round Robin' }
      ]
    };
  },
  methods: {
    initializePlayers() {
      this.players = Array.from({ length: this.numPlayers }, () => ({
        name: '',
        score: 0,
        placement: null // Initialize placement
      }));
    },
    startTournament() {
      // Assign default names to players without a name
      this.players.forEach((player, index) => {
        if (!player.name.trim()) {
          player.name = `Player ${index + 1}`;
        }
      });

      this.$refs.playerInput.validatePlayers(); // Run validation after assigning default names

      if (this.validationPassed) {
        this.tournamentStarted = true;
        this.rounds.push({ roundNumber: this.currentRound, matchups: randomizeMatchups(this.players, this.tournamentType) });
        this.saveData();
      }
    },
    updateScore(matchup, result, roundIndex, matchIndex) {
      const totalRounds = Math.ceil(Math.log2(this.players.length)); // Total rounds in single elimination
      updateScore(this.rounds[roundIndex].matchups[matchIndex], result, roundIndex, totalRounds, this.tournamentType); // Use helper
      this.checkForNextRound();
      this.saveData();
    },
    checkForNextRound() {
      const allDecided = this.rounds[this.currentRound - 1].matchups.every(match => match.result !== null);

      if (allDecided) {
        // Round Robin: No additional rounds after all matchups
        if (this.tournamentType === 'round-robin') {
          return; // Stop after all matches are played
        }

        // Single Elimination Logic
        if (this.tournamentType === 'single-elimination') {
          const winners = this.rounds[this.currentRound - 1].matchups
            .filter(match => match.result === 1 || match.result === 2)
            .map(match => match.players[match.result - 1]);

          const losers = this.rounds[this.currentRound - 1].matchups
            .filter(match => match.result !== null)
            .map(match => match.players[match.result === 1 ? 1 : 0]);

          // Check if we are down to the final match
          if (winners.length === 2 && this.currentRound === 2) {
            // Add third place match round (semi-final losers)
            this.rounds.push({
              roundNumber: this.currentRound + 1,
              matchups: [{
                players: losers,
                result: null,
                matchNumber: 1
              }]
            });

            // Add final round
            this.rounds.push({
              roundNumber: this.currentRound + 2,
              matchups: [{
                players: winners,
                result: null,
                matchNumber: 1
              }]
            });

            this.currentRound += 2; // Increment for both third place and final rounds
            this.saveData();
            return;
          }

          // Proceed to next round if not yet in the final
          const nextRound = [];
          for (let i = 0; i < winners.length; i += 2) {
            const player1 = winners[i];
            const player2 = winners[i + 1] || { name: 'Bye', score: 0, isBye: true };

            const matchup = {
              players: [player1, player2],
              result: null,
              matchNumber: nextRound.length + 1
            };

            // Handle Bye in the next round
            if (player2.isBye) {
              player1.score += 3; // Player 1 gets 3 points for Bye
              matchup.result = 1;  // Mark the result for Player 1 win
            }

            nextRound.push(matchup);
          }

          this.rounds.push({ roundNumber: ++this.currentRound, matchups: nextRound });
          this.saveData();
        }
      }
    },
    getRoundLabel(roundNumber) {
      const totalRounds = Math.ceil(Math.log2(this.players.length)); // Calculate total number of rounds based on players

      if (roundNumber === 1) {
        return `Round of ${Math.pow(2, totalRounds)}`; // First round: Round of 16, Round of 32, etc.
      } else if (roundNumber === totalRounds) {
        return 'Final'; // Final match
      } else if (roundNumber === totalRounds - 1) {
        return 'Semi-finals'; // Semi-final match
      } else if (roundNumber === totalRounds - 2) {
        return 'Quarter-finals'; // Quarter-final match
      } else {
        const roundOf = Math.pow(2, totalRounds - roundNumber + 1); // Adjust the round calculation for earlier rounds
        return `Round of ${roundOf}`;
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
        currentRound: this.currentRound,
        tournamentType: this.tournamentType // Save tournament type
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
        this.tournamentType = tournamentData.tournamentType || 'single-elimination'; // Load tournament type
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
        <!-- Select Tournament Type -->
        <div v-if="!tournamentStarted" class="mb-3">
          <label for="tournamentType">Tournament Type</label>
          <select v-model="tournamentType" id="tournamentType" class="form-control">
            <option v-for="type in tournamentTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
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

        <!-- Matchup Display and Player Standings -->
        <div v-if="tournamentStarted" class="mt-5">
          <div v-for="(round, roundIndex) in rounds" :key="round.roundNumber" class="mt-5">
            <h3>Round {{ roundIndex + 1 }}
              <span v-if="tournamentType === 'single-elimination'">- {{ getRoundLabel(roundIndex + 1) }}</span>
            </h3>

            <MatchupDisplay :matchups="round.matchups" @updateScore="updateScore" @modifyResult="modifyResult"
              :roundIndex="roundIndex" />
          </div>

          <!-- Player Standings Section -->
          <PlayerStandings :players="players" :tournamentType="tournamentType" :rounds="rounds" />

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