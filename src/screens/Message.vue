<script setup lang="ts">
import { type ModelMessage, type TextPart, type ToolCallPart } from "ai";
import { useTerminalDimensions } from "@opentui/vue";
import { logToFile } from "../utils";
import Spinner from "./Spinner.vue";

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

const getPreview = (data: any) => {
  const jsonString = JSON.stringify(data);
  return jsonString.substring(0, 80) + "...";
};
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
    <boxRenderable v-for="content in messagesContent">
      <boxRenderable
        v-if="content.type === 'tool-call'"
        :border="true"
        :padding="1"
        flexDirection="column"
        :gap="1"
        width="100%"
      >
        <boxRenderable :gap="1">
          <Spinner v-if="!content.output" />
          <textRenderable>
            {{ content.output ? "🛠️" : "" }} Tool: {{ content.toolName }}
          </textRenderable>
        </boxRenderable>
        <boxRenderable flexDirection="column">
          <textRenderable>Input: </textRenderable>
          <textRenderable>
            {{ content.input ? getPreview(content.input) : "No Input" }}
          </textRenderable>
        </boxRenderable>
        <boxRenderable v-if="content.output" flexDirection="column">
          <textRenderable>Output: </textRenderable>
          <textRenderable>
            {{ getPreview(content.output) }}
          </textRenderable>
        </boxRenderable>
      </boxRenderable>
      <textRenderable
        v-else
        :key="content.id"
        :content="content.text"
        :marginBottom="1"
      />
    </boxRenderable>
  </boxRenderable>
</template>
