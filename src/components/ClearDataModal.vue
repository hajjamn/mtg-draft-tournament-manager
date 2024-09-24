<script>
export default {
  methods: {
    clearData() {
      this.$emit("clearData");
      const modalElement = document.getElementById("clearDataModal");
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      modalInstance.hide();
    },
  },
};
</script>

<template>
  <div
    class="modal fade"
    id="clearDataModal"
    tabindex="-1"
    aria-labelledby="clearDataModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-sm">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="clearDataModalLabel">Clear Data</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body text-black">
          Are you sure you want to clear all tournament data?
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
          >
            Cancel
          </button>
          <button type="button" class="btn btn-danger" @click="clearData">
            Yes, Clear Data
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
