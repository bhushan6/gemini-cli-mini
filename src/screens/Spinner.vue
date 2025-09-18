<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const spinnerChars = ["|", "/", "-", "\\"];
const currentSpinnerChar = ref(spinnerChars[0]);
let intervalId: any;

onMounted(() => {
  let i = 0;
  intervalId = setInterval(() => {
    currentSpinnerChar.value = spinnerChars[i];
    i = (i + 1) % spinnerChars.length;
  }, 100);
});

onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<template>
  <textRenderable :content="currentSpinnerChar" />
</template>

