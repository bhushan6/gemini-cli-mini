<script setup lang="ts">
import { ref } from "vue";
import { TextAttributes, type ParsedKey } from "@opentui/core";
import { useKeyboard, useTerminalDimensions } from "@opentui/vue";

const props = defineProps({
  setApiKey: {
    type: Function,
    required: true,
  },
  setCurrentScreen: {
    type: Function,
    required: true,
  },
});

const inputValue = ref("");
const size = useTerminalDimensions();

function getClipboardText() {
  let command;
  let args: string[] = [];

  switch (process.platform) {
    case "darwin": // macOS
      command = "pbpaste";
      args = [];
      break;
    case "win32": // Windows
      command = "powershell";
      args = ["-command", "Get-Clipboard"];
      break;
    default: // Linux and others
      // You might need to install xclip: sudo apt-get install xclip
      command = "xclip";
      args = ["-o", "-selection", "clipboard"];
      break;
  }

  try {
    const { stdout, stderr, exitCode } = Bun.spawnSync([command, ...args]);

    if (exitCode !== 0) {
      const errorText = stderr.toString().trim();
      console.error(`Error getting clipboard content: ${errorText}`);
      return "";
    }

    return stdout.toString().trim();
  } catch (error) {
    console.error(
      `Failed to execute clipboard command "${command}". Is it installed and in your PATH?`
    );
    console.error(error);
    return "";
  }
}

const onKey = (key: ParsedKey) => {
  if (key.ctrl && (key.name === "v" || key.name === "V")) {
    const copiedText = getClipboardText();
    inputValue.value = copiedText;
  }
};

const onChange = (value: string) => {
  inputValue.value = value;
};

const onSubmit = (value: string) => {
  props.setApiKey(value);
  props.setCurrentScreen("Chat");
};

useKeyboard(onKey);
</script>
<template>
  <boxRenderable
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    :height="size.height"
    :gap="1"
  >
    <boxRenderable flexDirection="column" , alignItems="end">
      <asciiFontRenderable text="GEMINI CLI" font="block" />
      <textRenderable
        content="mini"
        :attributes="TextAttributes.DIM"
        alignSelf="end"
      />
    </boxRenderable>
    <boxRenderable
      flexDirection="column"
      :width="size.width * 0.7"
      :border="true"
      :gap="1"
    >
      <textRenderable>Gemini API key</textRenderable>
      <inputRenderable
        :focused="true"
        @submit="onSubmit"
        @change="onChange"
        :value="inputValue"
        :height="1"
      />
      <textRenderable :attributes="TextAttributes.DIM">
        "ctrl & v" to paste
      </textRenderable>
    </boxRenderable>
  </boxRenderable>
</template>
