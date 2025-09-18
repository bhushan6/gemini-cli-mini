// --- Tool to Read File Content ---

import { tool } from "ai";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";

const getFileContentTool = tool({
  description:
    "Reads the content of a specified file, limited to the first 10,000 characters.",
  inputSchema: z.object({
    filePath: z.string().describe("The relative path to the file to be read."),
  }),
  async *execute({ filePath }: { filePath: string }) {
    yield { state: "reading" as const, filePath };
    const MAX_CHARS = 10000;

    try {
      const workingDirectory = process.cwd();
      const absFilePath = path.resolve(workingDirectory, filePath);

      // Security Check: Ensure the file is within the working directory
      if (!absFilePath.startsWith(workingDirectory)) {
        yield {
          state: "error" as const,
          error: `Cannot read file '${filePath}' outside the allowed directory.`,
        };
        return;
      }

      const fileStats = await fs.stat(absFilePath);
      if (!fileStats.isFile()) {
        yield {
          state: "error" as const,
          error: `'${filePath}' is not a file.`,
        };
        return;
      }

      let content = await fs.readFile(absFilePath, "utf-8");
      let truncated = false;

      if (content.length > MAX_CHARS) {
        content = content.slice(0, MAX_CHARS);
        truncated = true;
      }

      yield {
        state: "complete" as const,
        filePath,
        content,
        truncated,
        message: truncated
          ? `Read first ${MAX_CHARS} characters from '${filePath}'.`
          : `Successfully read '${filePath}'.`,
      };
    } catch (error: any) {
      // Handle cases like file not found (ENOENT)
      yield {
        state: "error" as const,
        error: `Error reading file '${filePath}': ${error.message}`,
      };
    }
  },
});

// --- Tool to Write or Create a File ---

const writeFileTool = tool({
  description:
    "Writes content to a file. Creates parent directories if needed and overwrites the file if it exists.",
  inputSchema: z.object({
    filePath: z
      .string()
      .describe("The relative path for the file to be written."),
    content: z.string().describe("The content to write into the file."),
  }),
  async *execute({ filePath, content }: { filePath: string; content: string }) {
    yield { state: "writing" as const, filePath };

    try {
      const workingDirectory = process.cwd();
      const absFilePath = path.resolve(workingDirectory, filePath);

      // Security Check: Ensure the file is within the working directory
      if (!absFilePath.startsWith(workingDirectory)) {
        yield {
          state: "error" as const,
          error: `Cannot write file '${filePath}' outside the allowed directory.`,
        };
        return;
      }

      // Create parent directories recursively
      const parentDir = path.dirname(absFilePath);
      await fs.mkdir(parentDir, { recursive: true });

      // Write the file
      await fs.writeFile(absFilePath, content, "utf-8");

      yield {
        state: "complete" as const,
        filePath,
        charactersWritten: content.length,
        message: `Successfully wrote ${content.length} characters to '${filePath}'.`,
      };
    } catch (error: any) {
      yield {
        state: "error" as const,
        error: `Error writing to file '${filePath}': ${error.message}`,
      };
    }
  },
});

// --- Tool to Edit File Content (Find & Replace) ---

const editFileTool = tool({
  description:
    "Finds and replaces all occurrences of a specific string within a file.",
  inputSchema: z.object({
    filePath: z
      .string()
      .describe("The relative path to the file to be edited."),
    contentToReplace: z
      .string()
      .describe("The exact string to find in the file."),
    newContent: z
      .string()
      .describe(
        "The string that will replace all occurrences of 'contentToReplace'."
      ),
  }),
  async *execute({
    filePath,
    contentToReplace,
    newContent,
  }: {
    filePath: string;
    contentToReplace: string;
    newContent: string;
  }) {
    yield { state: "editing" as const, filePath };

    try {
      const workingDirectory = process.cwd();
      const absFilePath = path.resolve(workingDirectory, filePath);

      // Security Check: Ensure the file is within the working directory
      if (!absFilePath.startsWith(workingDirectory)) {
        yield {
          state: "error" as const,
          error: `Cannot edit file '${filePath}' outside the allowed directory.`,
        };
        return;
      }

      // 1. Read the original content
      const originalContent = await fs.readFile(absFilePath, "utf-8");

      // 2. Count occurrences and perform replacement
      const occurrences = (
        originalContent.match(
          new RegExp(
            contentToReplace.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "g"
          )
        ) || []
      ).length;

      if (occurrences === 0) {
        yield {
          state: "complete" as const,
          filePath,
          occurrences: 0,
          message: `No changes made, as '${contentToReplace}' was not found in '${filePath}'.`,
        };
        return;
      }

      const modifiedContent = originalContent.replace(
        new RegExp(
          contentToReplace.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g"
        ),
        newContent
      );

      // 3. Write the modified content back
      await fs.writeFile(absFilePath, modifiedContent, "utf-8");

      yield {
        state: "complete" as const,
        filePath,
        occurrences,
        message: `Successfully replaced ${occurrences} occurrence(s) in '${filePath}'.`,
      };
    } catch (error: any) {
      yield {
        state: "error" as const,
        error: `Error editing file '${filePath}': ${error.message}`,
      };
    }
  },
});

// --- Tool to List Files and Directories ---

const listFilesTool = tool({
  description:
    "Lists files and directories at a given path, showing their size and type.",
  inputSchema: z.object({
    directory: z
      .string()
      .optional()
      .default(".")
      .describe(
        "The path to list, relative to the working directory. Defaults to the current directory."
      ),
  }),
  async *execute({ directory }: { directory: string }) {
    yield { state: "listing" as const, directory };

    try {
      const workingDirectory = process.cwd();
      const absDirectoryPath = path.resolve(workingDirectory, directory);

      // Security Check: Ensure the path is within the working directory
      if (!absDirectoryPath.startsWith(workingDirectory)) {
        yield {
          state: "error" as const,
          error: `Cannot list contents of '${directory}' as it is outside the allowed directory.`,
        };
        return;
      }

      const items = await fs.readdir(absDirectoryPath);
      const fileDetails = [];

      for (const item of items) {
        const itemPath = path.join(absDirectoryPath, item);
        const stats = await fs.stat(itemPath);
        fileDetails.push({
          name: item,
          isDirectory: stats.isDirectory(),
          sizeBytes: stats.size,
        });
      }

      yield {
        state: "complete" as const,
        directory,
        files: fileDetails,
      };
    } catch (error: any) {
      yield {
        state: "error" as const,
        error: `Error listing files in '${directory}': ${error.message}`,
      };
    }
  },
});

export const systemPrompt = `You are an expert AI coding agent. Your primary goal is to assist users by understanding their requests and translating them into a sequence of file system operations.
  
  Core Directives
  Always create a function call plan to fulfill the user's request.
  
  Use relative paths for all file operations. The working directory is implicitly the project's root. Do not ask the user for the project's location.
  
  Be proactive in exploring the codebase. Before asking the user for file locations, always use the listFiles tool to inspect the current directory and its subdirectories to find relevant files.
  
  Request clarification only when necessary. If a request is ambiguous or you cannot locate the relevant files after searching, ask the user for more specific information.
  
  Available Tools
  You have access to the following file system tools:
  
  readFile(path: string): Reads the entire content of a file at the given path. Use this to understand the existing code before making changes.
  
  writeFile(path: string, content: string): Writes or overwrites a file at the given path with new content. Primarily use this for creating new files or for substantial rewrites of existing files.
  
  editFile(path: string, instructions: string): Performs targeted, in-place edits to an existing file based on natural language instructions. This should be your default choice for modifying existing code.
  
  listFiles(path: string): Lists all files and directories at a given path. Use . to list the contents of the root working directory.
  
  Tool Usage Guidelines
  editFile vs. writeFile
  Your default choice for modifying an existing file should be editFile. It is more precise and safer.
  
  Use editFile for:
  
  Adding or removing a function.
  
  Fixing a bug.
  
  Refactoring a specific section of code.
  
  Updating dependencies or configuration values.
  
  Use writeFile for:
  
  Creating a new file from scratch.
  
  Completely replacing the contents of an existing file (e.g., updating a file to a new major version).
  
  Suggested Workflow
  1. Analyze the Request: Deconstruct the user's goal. What needs to be created, read, or modified?
  
  2. Explore (if necessary): Use listFiles to get a layout of the project and identify the target files.
  
  3. Read (if necessary): Use readFile on the target files to gather context and understand the code you are about to modify.
  
  4. Plan the Execution: Formulate a step-by-step plan using the available tools in the most logical and efficient order.
  
  Present the Plan: Output the final, ordered list of function calls.`;

export const tools = {
  getFileContent: getFileContentTool,
  writeFile: writeFileTool,
  editFile: editFileTool,
  listFiles: listFilesTool,
} as const;

export function logToFile(message: string, filename: string = "app.log"): void {
  const fs = require("fs");
  const path = require("path");

  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    // Ensure the directory exists
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Append to log file
    fs.appendFileSync(filename, logEntry, "utf8");
  } catch (error) {
    console.error("Failed to write to log file:", error);
  }
}
