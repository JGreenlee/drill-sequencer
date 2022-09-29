<script lang="ts">
import { initStack, usePdStore } from './stores/DrillProject';

export default {
  mounted() {
    const proj = usePdStore();
    initStack();
  }
}

</script>

<template>
  <header>
  </header>
  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 5rem;
}
</style>
