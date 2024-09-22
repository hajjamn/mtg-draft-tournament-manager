<script>
import AppHeader from './layout/AppHeader.vue';
import AppContent from './layout/AppContent.vue';
import AppFooter from './layout/AppFooter.vue';

export default {
  components: {
    AppHeader,
    AppContent,
    AppFooter
  }
};
</script>

<template>
  <div id="app">
    <AppHeader />
    <div class="content-wrapper">
      <AppContent />
      <AppFooter />
    </div>
  </div>
</template>

<style lang="scss">
@use './assets/style/general.scss';
</style>
