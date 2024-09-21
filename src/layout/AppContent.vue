<script>
import PlayerInput from '../components/PlayerInput.vue';
import MatchupDisplay from '../components/MatchupDisplay.vue';
import PlayerStandings from '../components/PlayerStandings.vue';
import ClearDataModal from '../components/ClearDataModal.vue';

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
      rounds: [], // To store the matchups by round
      currentRound: 1,
      showModal: false, // Modal state
      validationPassed: false // To track validation status
    };
  },
  methods: {
    startTournament() {
      // Call validatePlayers method explicitly
      this.$refs.playerInput.validatePlayers();
      if (this.validationPassed) {
        this.tournamentStarted = true;
        this.randomizeMatchups(); // First round
        this.saveData();
      }
    },
    randomizeMatchups() {
      const shuffledPlayers = [...this.players].sort(() => 0.5 - Math.random());
      const matchups = [];
      for (let i = 0; i < shuffledPlayers.length; i += 2) {
        const player1 = shuffledPlayers[i];
        const player2 = shuffledPlayers[i + 1] || { name: 'Bye', score: 0 };
        matchups.push({
          players: [player1, player2],
          result: null,
          matchNumber: matchups.length + 1
        });
      }
      this.rounds.push({ roundNumber: this.currentRound, matchups }); // Store matches by round
      this.saveData();
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

        // Create new round with winners and losers
        const nextRound = [
          {
            players: [winners[0], winners[1]],
            result: null,
            matchNumber: 1
          },
          {
            players: [losers[0], losers[1]],
            result: null,
            matchNumber: 2
          }
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
      // Reset all rounds after the current one
      this.rounds = this.rounds.slice(0, this.currentRound);
    },
    clearData() {
      this.showModal = true; // Show modal when user tries to clear data
    },
    confirmClear() {
      localStorage.removeItem('tournamentData'); // Clear localStorage
      location.reload(); // Refresh the page
      this.showModal = false;
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
      this.validationPassed = passed; // Update validation status
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
        <!-- Player Input -->
        <form @submit.prevent="startTournament" v-if="!tournamentStarted">
          <!-- Use ref to access validatePlayers method -->
          <PlayerInput ref="playerInput" :players="players" @validatePlayers="handleValidation" />
          <button type="submit" class="btn btn-primary">Start Tournament</button>
        </form>

        <!-- Matchup Display and Player Standings -->
        <div v-if="tournamentStarted" class="mt-5">
          <div v-for="(round, roundIndex) in rounds" :key="round.roundNumber" class="mt-5">
            <h3>Round {{ round.roundNumber }}</h3>
            <MatchupDisplay :matchups="round.matchups" @updateScore="updateScore" @modifyResult="modifyResult"
              :roundIndex="roundIndex" />
          </div>

          <!-- Player Standings Section -->
          <PlayerStandings :players="players" />

          <!-- Buttons to Clear Data -->
          <div class="mt-4">
            <button type="button" class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#clearDataModal">
              Clear Tournament Data
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Component -->
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
