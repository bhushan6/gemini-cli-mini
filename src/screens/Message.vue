<script setup lang="ts">
import {
  convertToModelMessages,
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

const t = [
  { role: "user", content: "Hi" },
  {
    role: "assistant",
    content: [{ type: "text", text: "Hi there! How can I help you today?\n" }],
  },
  { role: "user", content: "Whats the weather in mumbai?" },
  {
    role: "assistant",
    content: [
      {
        toolCallId: "ZPdpdraP6StymXDa",
        toolName: "getWeather",
        type: "tool-call",
        input: null,
        output: {
          state: "ready",
          city: "mumbai",
          temperature: 80,
          weather: "sunny",
          humidity: 72,
        },
      },
      {
        type: "text",
        text: "The weather in Mumbai is sunny with a temperature of 80 degrees and 72% humidity.\n",
      },
    ],
  },
  { role: "user", content: "ok" },
  {
    role: "assistant",
    content: [
      { type: "text", text: "Is there anything else I can help you with?\n" },
    ],
  },
  { role: "user", content: "whats 2+126123" },
  {
    role: "assistant",
    content: [
      {
        toolCallId: "EZfia7biqNN2Dt6m",
        toolName: "calculate",
        type: "tool-call",
        input: null,
        output: { state: "complete", expression: "2+126123", result: 126125 },
      },
      { type: "text", text: "2 + 126123 is 126125.\n" },
    ],
  },
];

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
