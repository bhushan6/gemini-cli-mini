<script setup lang="ts">
import {
  type ModelMessage,
  type TextPart,
  type ToolCallPart,
  type ToolResultPart,
} from "ai";
import { useTerminalDimensions } from "@opentui/vue";

interface MessageItemProps {
  message: ModelMessage;
}

const props = defineProps<MessageItemProps>();

const roleIcons: Record<ModelMessage["role"], string> = {
  assistant: "🤖",
  system: "👨‍💻",
  tool: "🛠️",
  user: "👤",
};

const size = useTerminalDimensions();

const messagesContent: (TextPart | ToolCallPart | ToolResultPart)[] =
  typeof props.message.content === "string"
    ? [{ type: "text", text: props.message.content }]
    : props.message.content;
</script>

<template>
  <boxRenderable
    :paddingTop="1"
    :paddingBottom="1"
    :paddingLeft="2"
    :paddingRight="2"
    :border="['left']"
    :borderColor="message.role === 'user' ? '#00ff00' : '#0088ff'"
    :backgroundColor="message.role === 'user' ? '#001100' : '#000022'"
    :width="size.width"
  >
    <textRenderable :fg="message.role === 'user' ? '#00ff00' : '#0088ff'">
      {{ roleIcons[message.role] }}{{ message.role }}
    </textRenderable>
    <textRenderable
      v-for="(content, index) in messagesContent"
      :key="index"
      :content="
        content.type === 'text' ? content.text : content.toolName || '><'
      "
    />
  </boxRenderable>
</template>
