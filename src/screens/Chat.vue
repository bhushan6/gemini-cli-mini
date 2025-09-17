<script setup lang="ts">
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { useTerminalDimensions } from "@opentui/vue";
import {
  stepCountIs,
  streamText,
  tool,
  type AssistantModelMessage,
  type ModelMessage,
  type TextPart,
  type ToolCallPart,
} from "ai";
import { ref } from "vue";
import Message from "./Message.vue";
import { systemPrompt, tools } from "../utils";

const props = defineProps({
  apiKey: {
    type: String,
    required: true,
  },
});
const size = useTerminalDimensions();

const inputValue = ref("");

const google = createGoogleGenerativeAI({
  apiKey: props.apiKey,
});

const messagesArray = ref<ModelMessage[]>([]);

const isGenerating = ref(false);

const onSubmit = async (message: string) => {
  messagesArray.value.push({
    role: "user",
    content: message,
  });
  inputValue.value = "";
  isGenerating.value = true;
  const result = streamText({
    model: google("gemini-2.0-flash-001"),
    system: systemPrompt,
    messages: messagesArray.value,
    tools,
    stopWhen: stepCountIs(20),
  });

  const stream = result.toUIMessageStream();

  const assistantModelMessage: AssistantModelMessage = {
    role: "assistant",
    content: [],
  };

  const resetLastMessage = () => {
    // logToFile("pushed last message");
    messagesArray.value.pop();
    messagesArray.value.push(assistantModelMessage);
  };

  for await (const chunk of stream) {
    if (chunk.type === "tool-input-start") {
      const toolCallContent: ToolCallPart & { output: unknown } = {
        toolCallId: chunk.toolCallId,
        toolName: chunk.toolName,
        type: "tool-call",
        input: null,
        output: null,
      };

      assistantModelMessage.content.push(toolCallContent);
      resetLastMessage();
    } else if (chunk.type === "tool-input-available") {
      assistantModelMessage.content = assistantModelMessage.content.map((c) => {
        if (c.type === "tool-call" && c.toolCallId === chunk.toolCallId) {
          return { ...c, input: chunk.input };
        }
        return c;
      });
      resetLastMessage();
    } else if (chunk.type === "tool-output-available") {
      let wasToolAvailable = false;
      assistantModelMessage.content = assistantModelMessage.content.map((c) => {
        if (c.type === "tool-call" && c.toolCallId === chunk.toolCallId) {
          wasToolAvailable = true;
          return { ...c, output: chunk.output };
        }
        return c;
      });
      if (!wasToolAvailable) {
        assistantModelMessage.content.push({
          type: "tool-call",
          toolCallId: chunk.toolCallId,
          output: chunk.output,
        });
      }
      resetLastMessage();
    } else if (chunk.type === "text-start") {
      const textContent: TextPart = {
        type: "text",
        text: "",
      };
      assistantModelMessage.content.push(textContent);
      resetLastMessage();
    } else if (chunk.type === "text-delta") {
      assistantModelMessage.content = assistantModelMessage.content.map((c) => {
        if (c.type === "text") {
          return { ...c, text: `${c.text}${chunk.delta}` };
        }
        return c;
      });
      resetLastMessage();
    } else if (chunk.type === "text-end") {
      // nothing to do here since text-delta gives all the text
    } else if (chunk.type === "error") {
      //   logToFile(chunk.errorText);
    } else if (chunk.type === "finish") {
      //   const result = await stream.text;
      //   messagesArray.value.push({
      //     role: "assistant",
      //     content: result,
      //   });
    } else if (chunk.type === "start") {
      messagesArray.value.push(assistantModelMessage);
    } else {
      //unhandled type for now
      //   logToFile(`${chunk.type} is not handled`);
    }
  }

  isGenerating.value = false;
};

const onChange = (value: string) => {
  inputValue.value = value;
};
</script>
<template>
  <boxRenderable
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    :height="size.height"
  >
    <boxRenderable
      :border="true"
      :width="size.width"
      :height="size.height * 0.8"
    >
      <scrollBoxRenderable
        ref="scrollRef"
        :live="true"
        :scrollbarOptions="{ visible: true }"
        :contentOptions="{
          //   gap: 1,
        }"
      >
        <Message
          v-for="(message, index) in messagesArray"
          :key="JSON.stringify(message)"
          :message="message"
        />
      </scrollBoxRenderable>
    </boxRenderable>
    <boxRenderable :border="true" :width="size.width">
      <inputRenderable
        :height="1"
        width="100%"
        :focused="!isGenerating"
        :onChange="onChange"
        :value="inputValue"
        :onSubmit="onSubmit"
      />
    </boxRenderable>
  </boxRenderable>
</template>
