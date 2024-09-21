<script>
export default {
  data() {
    return {
      players: [{ name: '' }, { name: '' }, { name: '' }, { name: '' }],
      tournamentConfig: {
        bestOfThree: Boolean,
        tournamentType: Number,
      },
      tournamentStarted: false
    };
  },
  methods: {
    startTournament() {
      this.tournamentStarted = true;
    }
  }
};
</script>

<template>
  <div class="container py-5">


    <h2>Enter Player Names</h2>

    <!-- Form to Insert Player Names -->
    <form @submit.prevent="startTournament">
      <div v-for="(player, index) in players" :key="index" class="mb-3">
        <label :for="'player' + index">Player {{ index + 1 }}</label>
        <input v-model="player.name" :id="'player' + index" type="text" class="form-control"
          placeholder="Enter player name" />
      </div>

      <button type="submit" class="btn btn-primary">Start Tournament</button>
    </form>

    <!-- Display Player Names -->
    <div v-if="tournamentStarted" class="mt-5">
      <h3>Players:</h3>
      <ul>
        <li v-for="(player, index) in players" :key="index">{{ player.name }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* Optional styling to make the form look cleaner */
.mt-5 {
  margin-top: 3rem;
}
</style>
