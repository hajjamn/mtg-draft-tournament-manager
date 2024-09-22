<script>
export default {};
</script>

<template>
  <footer class="app-footer">
    <div class="container py-0 text-center text-white">
      <div class="row justify-content-center align-baseline">
        <div class="col-auto">
          <p>
            Made with ❤️ by hajjamn
          </p>
        </div>
        <div class="col-auto">
          <a href="https://github.com/hajjamn" target="_blank">
            <font-awesome-icon :icon="['fab', 'github']" class="fs-6 footer-icon" />
          </a>
          <a href="https://www.linkedin.com/in/hajjamn/" target="_blank">
            <font-awesome-icon :icon="['fab', 'linkedin']" class="fs-6 ms-2 footer-icon" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
footer.app-footer {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 12px;
  font-style: italic;
  padding: 20px 0;
  text-align: center;
}

footer .footer-icon {
  color: white;
}

footer .footer-icon:hover {
  color: #797979;
}
</style>