<script setup lang="ts">
import { ref, onMounted } from "vue";
import Home from "./screens/Home.vue";
import { useCliRenderer } from "@opentui/vue";
import Chat from "./screens/Chat.vue";

const currentScreen = ref("Home");
const apiKey = ref<string | null>(null);
const renderer = useCliRenderer();

const setApiKey = (key: string) => {
  apiKey.value = key;
};

const setCurrentScreen = (screen: "Chat" | "Home") => {
  currentScreen.value = screen;
};

onMounted(() => {
  // renderer.useConsole = true;
  // renderer.console.show();
});
</script>

<template>
  <Home
    v-if="currentScreen === 'Home'"
    :setApiKey="setApiKey"
    :setCurrentScreen="setCurrentScreen"
  />
  <Chat v-else-if="currentScreen === 'Chat' && apiKey" :apiKey="apiKey" />
  <!-- <boxRenderable
    v-else-if="currentScreen === 'Chat'"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    :height="size.height"
    :gap="1"
    :live="true"
  >
    <textRenderable>{{ apiKey }}</textRenderable>
  </boxRenderable> -->
</template>
