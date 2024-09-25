<script>
import PlayerInput from "../components/PlayerInput.vue";
import MatchupDisplay from "../components/MatchupDisplay.vue";
import PlayerStandings from "../components/PlayerStandings.vue";
import ClearDataModal from "../components/ClearDataModal.vue";
import {
  randomizeMatchups,
  updateResult,
  modifyResult,
  saveTournamentData,
  loadTournamentData,
  createJSONFile,
  processUploadedFile,
} from "../utils/tournamentHelpers.js";
import { debugLog } from "../utils/debugHelpers";

export default {
  components: {
    PlayerInput,
    MatchupDisplay,
    PlayerStandings,
    ClearDataModal,
  },
  data() {
    return {
      numPlayers: null,
      players: [],
      tournamentStarted: false,
      rounds: [],
      currentRound: 1,
      tournamentType: "single-elimination",
      bestOfThree: false,
      validationPassed: false,
      uploadError: "",
      tournamentTypes: [
        { value: "single-elimination", label: "Single Elimination" },
        { value: "round-robin", label: "Round Robin" },
      ],
    };
  },
  methods: {
    initializePlayers() {
      this.players = Array.from({ length: this.numPlayers }, () => ({
        name: "",
        score: 0,
        wins: 0,
        ties: 0,
        losses: 0,
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
        this.rounds.push({
          roundNumber: this.currentRound,
          matchups: randomizeMatchups(this.players, this.tournamentType),
        });
        this.saveData();
      }
    },
    handleValidation(passed) {
      this.validationPassed = passed;
    },
    handleSubmittedResult(roundIndex, matchIndex, result) {
      debugLog(
        `Handling submitted result for round ${roundIndex + 1}, match ${
          matchIndex + 1
        }:`,
        result
      );
      this.updateResult(roundIndex, matchIndex, result);
    },
    updateResult(roundIndex, matchIndex, result) {
      if (!this.rounds[roundIndex] || !this.rounds[roundIndex].matchups) return;

      const matchup = this.rounds[roundIndex].matchups[matchIndex];
      debugLog("matcup: ", matchup);
      const playerA = matchup.players[0];
      const playerB = matchup.players[1];

      debugLog("Before updating, playerA:", playerA, "playerB:", playerB);

      matchup.result = result;
      debugLog("Updated matchup result:", matchup.result);

      if (this.bestOfThree) {
        debugLog("We are entering the bo3: ", this.bestOfThree);
        debugLog("result: ", result);
        if (
          result.playerAWins !== undefined &&
          result.playerBWins !== undefined
        ) {
          debugLog("Entering the if that regards: ", result.playerAWins);
          const totalWins = result.playerAWins + result.playerBWins;
          if (totalWins < 2 || totalWins > 3) {
            debugLog("Invalid Bo3 result, skipping update.");
            return;
          }

          const matchOutcome = `${result.playerAWins}-${result.playerBWins}`;

          switch (matchOutcome) {
            case "2-0":
              playerA.score += 3;
              playerA.wins += 2;
              playerB.losses += 2;
              break;

            case "0-2":
              playerB.score += 3;
              playerB.wins += 2;
              playerA.losses += 2;
              break;

            case "2-1":
              playerA.score += 2;
              playerB.score += 1;
              playerA.wins += 2;
              playerA.losses += 1;
              playerB.wins += 1;
              playerB.losses += 2;
              break;

            case "1-2":
              playerB.score += 2;
              playerA.score += 1;
              playerB.wins += 2;
              playerB.losses += 1;
              playerA.wins += 1;
              playerA.losses += 2;
              break;

            default:
              debugLog("Unexpected result:", result);
          }
        }
      } else {
        if (result === 1) {
          playerA.wins++;
          playerB.losses++;
        } else if (result === 2) {
          playerB.wins++;
          playerA.losses++;
        }
      }

      debugLog("After updating, playerA:", playerA, "playerB:", playerB);
      debugLog(
        "playerA score:",
        playerA.score,
        "playerB score:",
        playerB.score
      );

      this.checkForNextRound();
      this.saveData();
    },
    checkForNextRound() {
      const allDecided = this.rounds[this.currentRound - 1].matchups.every(
        (match) => {
          if (this.bestOfThree) {
            return (
              match.result &&
              match.result.playerAWins !== undefined &&
              match.result.playerBWins !== undefined
            );
          }
          return match.result !== null;
        }
      );

      if (allDecided) {
        if (this.tournamentType === "round-robin") {
          // In round-robin, once all matches are played, stop generating new rounds
          if (this.rounds.length === this.players.length - 1) {
            this.determineWinners();
          }
          return; // Do not advance players in round-robin
        }

        if (this.tournamentType === "single-elimination") {
          let winners = [];

          if (this.bestOfThree) {
            winners = this.rounds[this.currentRound - 1].matchups
              .filter(
                (match) =>
                  match.result.playerAWins === 2 ||
                  match.result.playerBWins === 2
              )
              .map((match) =>
                match.result.playerAWins === 2
                  ? match.players[0]
                  : match.players[1]
              );
          } else {
            winners = this.rounds[this.currentRound - 1].matchups
              .filter((match) => match.result === 1 || match.result === 2)
              .map((match) => match.players[match.result - 1]);
          }

          if (winners.length <= 1) {
            this.determineWinners(); // Only one winner left, tournament complete
            return;
          }

          const nextRound = randomizeMatchups(winners, this.tournamentType);
          this.rounds.push({
            roundNumber: ++this.currentRound,
            matchups: nextRound,
          });
          debugLog("The current round is now: ", this.currentRound);
          this.saveData();
        }
      }
    },
    checkForTieBreakers() {
      // Sort players based on score, wins, losses, and head-to-head matches
      const sortedPlayers = this.getSortedPlayers();

      // Find tied players in the top 4
      const tiedPlayers = sortedPlayers.filter((player, index, array) => {
        return (
          index < 4 &&
          array[index + 1] &&
          player.score === array[index + 1].score
        );
      });

      if (tiedPlayers.length > 0) {
        // Create new tiebreaker matches for tied players
        const tiebreakerRound = randomizeMatchups(
          tiedPlayers,
          "single-elimination"
        );
        this.rounds.push({
          roundNumber: ++this.currentRound,
          matchups: tiebreakerRound,
        });
        this.saveData();
        return true;
      }

      return false; // No tiebreakers needed
    },
    determineWinners() {
      // Sort players based on the current standings
      const finalStandings = this.getSortedPlayers();

      this.winners = finalStandings.slice(0, 4); // Top 4 players

      // Optional: Display the winners
      alert(
        `Tournament Winners: ${this.winners
          .map((player) => player.name)
          .join(", ")}`
      );

      this.tournamentCompleted = true;
    },
    getSortedPlayers() {
      return [...this.players].sort((a, b) => {
        if (a.score === b.score) {
          if (a.wins === b.wins) {
            if (a.losses === b.losses) {
              const headToHead = this.checkHeadToHead(a, b);
              return headToHead !== 0
                ? headToHead
                : a.name.localeCompare(b.name);
            }
            return a.losses - b.losses;
          }
          return b.wins - a.wins;
        }
        return b.score - a.score;
      });
    },
    checkHeadToHead(playerA, playerB) {
      const matchBetween = this.rounds
        .flatMap((round) => round.matchups)
        .find(
          (match) =>
            match.players.includes(playerA) && match.players.includes(playerB)
        );

      if (!matchBetween || !matchBetween.result) {
        debugLog(
          `No valid result found for the match between ${playerA.name} and ${playerB.name}.`
        );
        return 0; // No valid result to determine head-to-head
      }

      if (matchBetween.result === 1) {
        return playerA === matchBetween.players[0] ? -1 : 1;
      } else if (matchBetween.result === 2) {
        return playerB === matchBetween.players[1] ? -1 : 1;
      }

      return 0;
    },
    modifyResult(roundIndex, matchIndex) {
      debugLog(
        "Modifying result for roundIndex:",
        roundIndex,
        "and matchIndex:",
        matchIndex
      );

      if (
        this.rounds[roundIndex] &&
        this.rounds[roundIndex].matchups[matchIndex]
      ) {
        debugLog("Matchup exists, modifying the result.");
        modifyResult(this.rounds[roundIndex].matchups[matchIndex]);
        this.resetNextRounds();
        this.checkForNextRound();
        this.saveData();
        debugLog("The current rounds array is: ", this.rounds);
      } else {
        debugLog(
          "Attempted to modify a result in a non-existing round or match."
        );
      }
    },
    resetNextRounds() {
      debugLog("Resetting rounds after current round:", this.currentRound);

      this.rounds = [...this.rounds.slice(0, this.currentRound - 1)];

      this.currentRound--;
      debugLog("Current rounds after reset:", this.rounds);
    },
    clearData() {
      localStorage.removeItem("tournamentData");
      location.reload();
    },
    saveData() {
      saveTournamentData(
        this.players,
        this.rounds,
        this.tournamentStarted,
        this.currentRound,
        this.tournamentType,
        this.bestOfThree
      );
    },
    loadData() {
      const data = localStorage.getItem("tournamentData");
      if (data) {
        const tournamentData = JSON.parse(data);
        this.players = tournamentData.players;
        this.rounds = tournamentData.rounds;
        this.tournamentStarted = tournamentData.tournamentStarted;
        this.currentRound = tournamentData.currentRound;
        this.tournamentType =
          tournamentData.tournamentType || "single-elimination";
        this.bestOfThree = tournamentData.bestOfThree || false;
      }
    },
    downloadJSON() {
      const tournamentData = {
        players: this.players,
        rounds: this.rounds,
        tournamentStarted: this.tournamentStarted,
        currentRound: this.currentRound,
        tournamentType: this.tournamentType,
        bestOfThree: this.bestOfThree, // Add bestOfThree here
      };
      createJSONFile(tournamentData);
    },
    async handleFileUpload(event) {
      const file = event.target.files[0];
      const result = await processUploadedFile(file); // Call the helper function

      if (result.success) {
        const {
          players,
          rounds,
          currentRound,
          tournamentStarted,
          bestOfThree,
        } = result.data;
        this.players = players;
        this.rounds = rounds;
        this.currentRound = currentRound;
        this.tournamentStarted = tournamentStarted;
        this.bestOfThree = bestOfThree || false;
        this.uploadError = "";
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
      this.tournamentType =
        tournamentData.tournamentType || "single-elimination";
      this.bestOfThree = tournamentData.bestOfThree;
    }
  },
};
</script>

<template>
  <div class="overlay">
    <div class="container">
      <!-- Select Tournament Type -->
      <div v-if="!tournamentStarted" class="mb-3">
        <label for="tournamentType">Tournament Type</label>
        <select
          v-model="tournamentType"
          id="tournamentType"
          class="form-control"
        >
          <option
            v-for="type in tournamentTypes"
            :key="type.value"
            :value="type.value"
          >
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
        <input
          type="number"
          v-model="numPlayers"
          @input="initializePlayers"
          class="form-control"
          min="2"
          max="16"
          placeholder="3, 4, 5 etc..."
        />
      </div>

      <!-- Player Input Fields -->
      <form @submit.prevent="startTournament" v-if="!tournamentStarted">
        <PlayerInput
          ref="playerInput"
          :players="players"
          @validatePlayers="handleValidation"
        />
        <button type="submit" class="btn btn-primary">Start Tournament</button>
      </form>

      <!-- Matchup Display -->
      <div v-if="tournamentStarted" class="mt-5">
        <div
          v-for="(round, roundIndex) in rounds"
          :key="round.roundNumber"
          class="mt-5"
        >
          <h3>Round {{ roundIndex + 1 }}</h3>
          <MatchupDisplay
            :matchups="round.matchups"
            :roundIndex="roundIndex"
            :tournamentType="tournamentType"
            :bestOfThree="bestOfThree"
            @submitResult="handleSubmittedResult"
            @modifyResult="modifyResult"
          />
        </div>

        <!-- Display Standings if the tournament has started -->
        <PlayerStandings
          :sortedPlayers="getSortedPlayers()"
          :tournamentType="tournamentType"
          :bestOfThree="bestOfThree"
        />

        <!-- Buttons to Download Data and Clear Data -->
        <div class="mt-4">
          <button type="button" class="btn btn-primary" @click="downloadJSON">
            Download Tournament Data
          </button>
          <button
            type="button"
            class="btn btn-danger"
            data-bs-toggle="modal"
            data-bs-target="#clearDataModal"
          >
            Clear Tournament Data
          </button>
        </div>
      </div>

      <!-- Clear Data Modal -->
      <ClearDataModal @confirmClearData="clearData" />

      <!-- File input for JSON upload -->
      <div class="mt-4">
        <label for="fileUpload">Upload Tournament Data (JSON)</label>
        <input
          type="file"
          id="fileUpload"
          @change="handleFileUpload"
          accept=".json"
        />
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

input:checked + .slider {
  background-color: #4caf50;
}

input:checked + .slider:before {
  transform: translateX(25px);
}
</style>
