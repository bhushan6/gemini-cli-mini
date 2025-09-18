<script setup lang="ts">
import {
  type ModelMessage,
  type TextPart,
  type ToolCallPart,
  type ToolResultPart,
} from "ai";
import { useTerminalDimensions } from "@opentui/vue";
import { logToFile } from "../utils";

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

const messagesContent: (
  | (TextPart & { id: string })
  | (ToolCallPart & { output: unknown })
)[] =
  typeof props.message.content === "string"
    ? [{ type: "text", text: props.message.content }]
    : props.message.content;

messagesContent.forEach((c) => {
  c.type === "tool-call" && logToFile(JSON.stringify(c.output || {}));
});
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
    <textRenderable
      :fg="message.role === 'user' ? '#00ff00' : '#0088ff'"
      :marginBottom="1"
    >
      {{ roleIcons[message.role] }}{{ message.role }}
    </textRenderable>
    <boxRenderable
      v-for="content in messagesContent"
      :border="content.type === 'tool-call'"
      :title="content.type == 'tool-call' ? 'Tool' : ''"
    >
      <textRenderable
        :key="content.type === 'tool-call' ? content.toolCallId : content.id"
        :content="content.type === 'text' ? content.text : content.toolName"
        :marginBottom="1"
      />
    </boxRenderable>
  </boxRenderable>
</template>
