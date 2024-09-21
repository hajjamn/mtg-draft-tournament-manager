<script>
export default {
  props: {
    players: Array
  },
  data() {
    return {
      validationErrors: [] // To store any validation errors
    };
  },
  methods: {
    validatePlayers() {
      this.validationErrors = [];

      // Check for empty names
      this.players.forEach((player, index) => {
        if (!player.name) {
          this.validationErrors.push(`Player ${index + 1} name cannot be empty`);
        }
      });

      // Check for duplicate names
      const names = this.players.map(player => player.name);
      const uniqueNames = [...new Set(names)];
      if (names.length !== uniqueNames.length) {
        this.validationErrors.push("Player names must be unique");
      }

      // Emit the validation result
      this.$emit('validatePlayers', this.validationErrors.length === 0);
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div v-for="(player, index) in players" :key="index" class="col-6 mb-3">
        <label :for="'player' + index">Player {{ index + 1 }}</label>
        <input v-model="player.name" :id="'player' + index" type="text" class="form-control"
          placeholder="Enter player name" />
      </div>
    </div>

    <!-- Validation Error Messages -->
    <div v-if="validationErrors.length" class="text-danger">
      <ul>
        <li v-for="(error, index) in validationErrors" :key="index">{{ error }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped></style>
