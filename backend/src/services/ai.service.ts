import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Part,
} from "@google/generative-ai";
import { ILessonPlan } from "../models/LessonPlan.model";
import { processFilesForAI } from "./file.service";
import dotenv from "dotenv";

dotenv.config();

interface LessonPlanInput {
  teacherName: string;
  subject: string;
  grade: string;
  educationLevel: "Mầm non" | "Tiểu học" | "THCS" | "THPT";
  duration: number;
  template: "5512" | "2345" | "1001";
  lessonTitle: string;
  uploadedFiles?: string[];
}

/**
 * Generate lesson plan using Google Gemini AI
 * Falls back to mock service if API key is not configured
 */
export const generateLessonPlan = async (
  input: LessonPlanInput
): Promise<ILessonPlan["content"]> => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // Fallback to mock if no API key
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found, using mock service");
    return generateMockLessonPlan(input);
  }

  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use model from env or default to gemini-2.5-flash (latest and fastest)
    // Note: Make sure Generative Language API is enabled in Google Cloud Console
    const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
    console.log(`Using Gemini model: ${modelName}`);

    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Process uploaded files
    let fileContext = "";
    let imageCount = 0;
    const parts: Part[] = [];

    if (input.uploadedFiles && input.uploadedFiles.length > 0) {
      try {
        const { pdfTexts, images } = await processFilesForAI(
          input.uploadedFiles
        );

        // Add PDF texts to context
        if (pdfTexts.length > 0) {
          fileContext = `\n\nNội dung từ tài liệu đã upload:\n${pdfTexts.join(
            "\n\n---\n\n"
          )}`;
        }

        // Add images to parts and count them
        imageCount = images.length;
        for (const image of images) {
          parts.push({
            inlineData: {
              data: image.base64,
              mimeType: image.mimeType,
            },
          } as Part);
        }
      } catch (error: any) {
        console.error("Error processing files:", error);
        // Continue without file context if processing fails
      }
    }

    // Build prompt according to Công văn 2345
    const prompt = buildPrompt(input, fileContext, imageCount);

    // Add text prompt as first part
    parts.unshift({ text: prompt } as Part);

    // Generate content with retry logic
    let response;
    let retries = 3;
    let lastError: Error | null = null;

    while (retries > 0) {
      try {
        // Use generateContent with parts array directly
        const result = await model.generateContent(parts);

        response = result.response;
        break;
      } catch (error: any) {
        lastError = error;
        retries--;

        // If it's a 404 error, it means model doesn't exist - don't retry
        if (error.status === 404) {
          console.error(`Model ${modelName} not found. Please check:`);
          console.error(
            "1. Make sure Generative Language API is enabled in Google Cloud Console"
          );
          console.error("2. Check if your API key has access to this model");
          console.error(
            "3. Try a different model name (gemini-1.5-flash, gemini-1.5-pro, gemini-pro)"
          );
          throw new Error(
            `Model ${modelName} not found. Please enable Generative Language API in Google Cloud Console or try a different model.`
          );
        }

        if (retries > 0) {
          console.warn(
            `Gemini API error, retrying... (${retries} attempts left)`
          );
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s before retry
        }
      }
    }

    if (!response) {
      throw lastError || new Error("Failed to generate response from Gemini");
    }

    const responseText = response.text();

    // Check if response is empty or too short
    if (!responseText || responseText.trim().length < 10) {
      console.error("❌ Gemini response is empty or too short");
      console.error("Response length:", responseText?.length || 0);
      console.error("Response text:", responseText);
      throw new Error("Gemini returned an empty response. Please try again.");
    }

    console.log(
      "✅ Received response from Gemini, length:",
      responseText.length
    );

    // Parse JSON response
    // Declare jsonText outside try block so it's accessible in catch
    let jsonText = responseText.trim();

    // Helper function to extract JSON from text (handles markdown code blocks)
    const extractJsonFromText = (text: string): string => {
      let extracted = text.trim();

      // Remove markdown code blocks (```json ... ``` or ``` ... ```)
      // Handle multiple code blocks or nested cases
      extracted = extracted.replace(/^```[a-z]*\s*/i, "");
      extracted = extracted.replace(/\s*```\s*$/i, "");
      // Also remove any remaining code block markers in the middle
      extracted = extracted.replace(/```[a-z]*\s*/gi, "");
      extracted = extracted.trim();

      // Try to find JSON object if not already extracted
      if (!extracted.startsWith("{")) {
        const jsonMatch = extracted.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extracted = jsonMatch[0];
        }
      }

      return extracted;
    };

    // Helper function to clean ellipsis characters (long sequences of dots)
    const cleanEllipsis = (text: string): string => {
      // Replace sequences of 10+ consecutive dots with empty string
      // This handles placeholder patterns like "................................................................................"
      // We'll do this carefully to only affect string values, not JSON structure
      let cleaned = text;
      let inString = false;
      let escapeNext = false;
      let result = "";

      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];

        if (escapeNext) {
          result += char;
          escapeNext = false;
          continue;
        }

        if (char === "\\") {
          escapeNext = true;
          result += char;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          result += char;
          continue;
        }

        if (inString) {
          // Inside a string - check for ellipsis patterns
          // Look ahead to see if we have a long sequence of dots
          if (char === ".") {
            let dotCount = 1;
            let j = i + 1;
            while (
              j < cleaned.length &&
              cleaned[j] === "." &&
              dotCount < 1000
            ) {
              dotCount++;
              j++;
            }

            // If we have 10+ dots, skip them all (don't add to result)
            if (dotCount >= 10) {
              i = j - 1; // Skip to after the dots
              continue; // Don't add the dots
            }
          }
          result += char;
        } else {
          // Outside string - keep as is
          result += char;
        }
      }

      // If string was left unclosed after cleaning, close it
      if (inString) {
        result += '"';
      }

      return result;
    };

    try {
      // Try to extract JSON from markdown code blocks if present
      jsonText = extractJsonFromText(responseText);

      // Clean ellipsis characters (long sequences of dots)
      jsonText = cleanEllipsis(jsonText);

      // Additional fix: Replace very long ellipsis patterns that might break JSON
      // This handles cases where ellipsis is so long it breaks the string structure
      // Process string by string to handle ellipsis properly
      let processedJson = "";
      let inStringEllipsis = false;
      let escapeNextEllipsis = false;
      let currentString = "";

      for (let i = 0; i < jsonText.length; i++) {
        const char = jsonText[i];

        if (escapeNextEllipsis) {
          if (inStringEllipsis) currentString += char;
          else processedJson += char;
          escapeNextEllipsis = false;
          continue;
        }

        if (char === "\\") {
          escapeNextEllipsis = true;
          if (inStringEllipsis) currentString += char;
          else processedJson += char;
          continue;
        }

        if (char === '"') {
          if (inStringEllipsis) {
            // Closing string - process ellipsis in currentString
            // Replace very long ellipsis (100+ dots) with shorter one (50 dots max)
            currentString = currentString.replace(/\.{100,}/g, ".".repeat(50));
            processedJson += '"' + currentString + '"';
            currentString = "";
            inStringEllipsis = false;
          } else {
            // Opening string
            inStringEllipsis = true;
            processedJson += char;
          }
          continue;
        }

        if (inStringEllipsis) {
          currentString += char;
        } else {
          processedJson += char;
        }
      }

      // Handle unclosed string
      if (inStringEllipsis && currentString.length > 0) {
        currentString = currentString.replace(/\.{100,}/g, ".".repeat(50));
        processedJson += '"' + currentString + '"';
      }

      jsonText = processedJson;

      // Fix property names that might be broken by newlines before cleaning
      // This handles cases where property names are split across lines
      // Example: "nhan_xe\n    t": -> "nhan_xet":
      jsonText = jsonText.replace(
        /"([a-z0-9_]+)"\s*\n\s*"([a-z0-9_]{1,5})"\s*:/gi,
        (match, p1, p2) => {
          // Merge if p2 looks like continuation of p1
          if (p2.length <= 5) {
            return `"${p1}${p2}":`;
          }
          return match;
        }
      );

      // Sanitize JSON: Remove control characters that are not allowed in JSON strings
      // But keep valid escape sequences like \n, \t, \", \\
      jsonText = jsonText.replace(/[\x00-\x1F\x7F]/g, (match, offset) => {
        // Check if it's part of a valid escape sequence
        const before = jsonText.substring(Math.max(0, offset - 1), offset);
        if (before === "\\") {
          // It's an escape sequence, keep it
          return match;
        }
        // Remove control characters that are not part of escape sequences
        // But allow \n, \t, \r if they're escaped
        if (match === "\n" || match === "\t" || match === "\r") {
          // These might be actual newlines/tabs in the JSON structure (outside strings)
          // We'll try to keep them for now and let JSON.parse handle it
          return match;
        }
        // Remove other control characters
        return "";
      });

      // Try to fix common JSON issues before first parse attempt
      // Fix missing commas between properties (more comprehensive)
      jsonText = jsonText.replace(/("\s*)\n\s*(")/g, "$1,\n$2"); // Missing comma between string properties
      jsonText = jsonText.replace(/("\s*)\n\s*(\[)/g, "$1,\n$2"); // Missing comma before array
      jsonText = jsonText.replace(/("\s*)\n\s*(\{)/g, "$1,\n$2"); // Missing comma before object
      jsonText = jsonText.replace(/(\]\s*)\n\s*(")/g, "$1,\n$2"); // Missing comma after array
      jsonText = jsonText.replace(/(\}\s*)\n\s*(")/g, "$1,\n$2"); // Missing comma after object
      jsonText = jsonText.replace(/(\d+)\s*\n\s*(")/g, "$1,\n$2"); // Missing comma after number
      jsonText = jsonText.replace(/(true|false|null)\s*\n\s*(")/g, "$1,\n$2"); // Missing comma after boolean/null

      // Fix missing commas without newlines (be careful not to break valid JSON)
      // Only fix when we have clear patterns that indicate missing commas
      jsonText = jsonText.replace(/(\})\s+(")/g, "$1,$2"); // Object followed by string property (with space)
      jsonText = jsonText.replace(/(\])\s+(")/g, "$1,$2"); // Array followed by string property (with space)
      jsonText = jsonText.replace(/(\d+)\s+(")/g, "$1,$2"); // Number followed by string property (with space)
      jsonText = jsonText.replace(/(true|false|null)\s+(")/g, "$1,$2"); // Boolean/null followed by string property (with space)

      // Remove duplicate commas and trailing commas
      jsonText = jsonText.replace(/,\s*,/g, ","); // Remove duplicate commas
      jsonText = jsonText.replace(/,\s*([}\]])/g, "$1"); // Remove trailing commas

      // Fix unclosed strings - find strings that are not properly closed
      // This handles cases where ellipsis or other issues cause strings to be unclosed
      let fixedJson = "";
      let inStringFix = false;
      let escapeNextFix = false;
      let stringStart = -1;

      for (let i = 0; i < jsonText.length; i++) {
        const char = jsonText[i];

        if (escapeNextFix) {
          fixedJson += char;
          escapeNextFix = false;
          continue;
        }

        if (char === "\\") {
          escapeNextFix = true;
          fixedJson += char;
          continue;
        }

        if (char === '"') {
          if (inStringFix) {
            // Closing string - check if this is valid
            // Look ahead to see if there's a colon, comma, or closing brace
            let j = i + 1;
            while (j < jsonText.length && /\s/.test(jsonText[j])) j++;

            if (
              j < jsonText.length &&
              (jsonText[j] === ":" ||
                jsonText[j] === "," ||
                jsonText[j] === "}" ||
                jsonText[j] === "]")
            ) {
              // Valid closing
              inStringFix = false;
              fixedJson += char;
            } else {
              // Might be part of content, keep it
              fixedJson += char;
            }
          } else {
            // Opening string
            inStringFix = true;
            stringStart = i;
            fixedJson += char;
          }
          continue;
        }

        fixedJson += char;
      }

      // If we're still in a string at the end, close it
      if (inStringFix) {
        fixedJson += '"';
      }

      // Try to fix common issues with property names that might be broken
      // Fix cases like "nhan_xe\nt": -> "nhan_xet":
      // Pattern: "text1"\n"text2": where text2 is short and looks like continuation
      fixedJson = fixedJson.replace(
        /"([^"]+)"\s*\n\s*"([^"]+)"\s*:/g,
        (match, p1, p2) => {
          // If p2 is very short (1-5 chars) and looks like continuation of p1, merge them
          if (p2.length <= 5 && /^[a-z0-9_]+$/i.test(p2) && !p1.endsWith('"')) {
            return `"${p1}${p2}":`;
          }
          return match;
        }
      );

      // Fix cases where property name is broken without quotes: "nhan_xe\nt":
      // This handles the specific error case where property name is split across lines
      fixedJson = fixedJson.replace(
        /"([^"]*?)\s*\n\s*([a-z0-9_]{1,5})"\s*:/gi,
        '"$1$2":'
      );

      // Fix missing colons after property names (simpler approach)
      // Pattern: "property" followed by whitespace and value (but no colon)
      // Only fix if we're inside an object (after { or ,)
      fixedJson = fixedJson.replace(
        /([,\{]\s*)"([a-z0-9_]+)"\s+(")/gi,
        '$1"$2": $3'
      );
      fixedJson = fixedJson.replace(
        /([,\{]\s*)"([a-z0-9_]+)"\s+(\{)/gi,
        '$1"$2": $3'
      );
      fixedJson = fixedJson.replace(
        /([,\{]\s*)"([a-z0-9_]+)"\s+(\[)/gi,
        '$1"$2": $3'
      );
      fixedJson = fixedJson.replace(
        /([,\{]\s*)"([a-z0-9_]+)"\s+(-?\d+)/gi,
        '$1"$2": $3'
      );
      fixedJson = fixedJson.replace(
        /([,\{]\s*)"([a-z0-9_]+)"\s+(true|false|null)/gi,
        '$1"$2": $3'
      );

      // Fix cases where property value might be broken across lines
      // Example: "nhan_xet": "text...\nmore text" -> "nhan_xet": "text...more text"
      // But be careful - only fix if it's clearly a broken string
      fixedJson = fixedJson.replace(
        /(":\s*")([^"]*?)\s*\n\s*([^"]*?)("\s*[,}])/g,
        (match, p1, p2, p3, p4) => {
          // Only fix if p2 and p3 don't contain quotes and it looks like a broken string
          if (
            !p2.includes('"') &&
            !p3.includes('"') &&
            p2.length > 0 &&
            p3.length > 0
          ) {
            return p1 + p2 + " " + p3 + p4;
          }
          return match;
        }
      );

      // Ensure all object/array structures are properly closed
      const openBraces = (fixedJson.match(/\{/g) || []).length;
      const closeBraces = (fixedJson.match(/\}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/\]/g) || []).length;

      // Close any unclosed structures at the end
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixedJson += "}";
      }
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixedJson += "]";
      }

      const parsed = JSON.parse(fixedJson);
      return validateAndFormatLessonPlan(parsed, input);
    } catch (parseError: any) {
      // Check error type to determine fix strategy
      const isMissingCommaError =
        parseError.message?.includes("Expected ','") ||
        parseError.message?.includes("Expected '}'");
      const isMissingColonError =
        parseError.message?.includes("Expected ':'") ||
        parseError.message?.includes("after property name");

      if (isMissingColonError) {
        // Try to fix missing colon error
        let jsonTextForFix = extractJsonFromText(responseText);
        jsonTextForFix = cleanEllipsis(jsonTextForFix);

        // Extract position from error message if available
        const positionMatch = parseError.message?.match(/position (\d+)/);
        const errorPosition = positionMatch ? parseInt(positionMatch[1]) : -1;

        // Fix missing colons after property names
        jsonTextForFix = jsonTextForFix.replace(
          /([,\{]\s*)"([a-z0-9_]+)"\s+(")/gi,
          '$1"$2": $3'
        );
        jsonTextForFix = jsonTextForFix.replace(
          /([,\{]\s*)"([a-z0-9_]+)"\s+(\{)/gi,
          '$1"$2": $3'
        );
        jsonTextForFix = jsonTextForFix.replace(
          /([,\{]\s*)"([a-z0-9_]+)"\s+(\[)/gi,
          '$1"$2": $3'
        );
        jsonTextForFix = jsonTextForFix.replace(
          /([,\{]\s*)"([a-z0-9_]+)"\s+(-?\d+)/gi,
          '$1"$2": $3'
        );
        jsonTextForFix = jsonTextForFix.replace(
          /([,\{]\s*)"([a-z0-9_]+)"\s+(true|false|null)/gi,
          '$1"$2": $3'
        );

        // If we have error position, try to fix at that specific position
        if (errorPosition > 0 && errorPosition < jsonTextForFix.length) {
          // Look backwards from error position to find property name
          let i = errorPosition - 1;
          while (i >= 0 && i > errorPosition - 50) {
            if (jsonTextForFix[i] === '"') {
              // Found a quote - might be end of property name
              // Check if there's a colon after it
              let j = i + 1;
              while (j < jsonTextForFix.length && /\s/.test(jsonTextForFix[j]))
                j++;
              if (j < jsonTextForFix.length && jsonTextForFix[j] !== ":") {
                // Missing colon - insert it
                jsonTextForFix =
                  jsonTextForFix.substring(0, j) +
                  ": " +
                  jsonTextForFix.substring(j);
                break;
              }
            }
            i--;
          }
        }

        try {
          const parsed = JSON.parse(jsonTextForFix);
          console.log("✅ Successfully fixed missing colon and parsed JSON");
          return validateAndFormatLessonPlan(parsed, input);
        } catch (retryError) {
          // If quick fix didn't work, continue to full retry logic
        }
      }

      if (isMissingCommaError) {
        // Re-extract jsonText from responseText for error fixing
        let jsonTextForFix = extractJsonFromText(responseText);
        jsonTextForFix = cleanEllipsis(jsonTextForFix);

        // Extract position from error message if available
        const positionMatch = parseError.message?.match(/position (\d+)/);
        const errorPosition = positionMatch ? parseInt(positionMatch[1]) : -1;

        if (errorPosition > 0 && errorPosition < jsonTextForFix.length) {
          // Try to fix by inserting a comma before the error position
          // Look backwards for the end of a value (quote, }, ], number, true/false/null)
          let fixedJson = jsonTextForFix;
          let insertPos = errorPosition;

          // Find where to insert comma (before the error position, after a value)
          for (
            let i = errorPosition - 1;
            i >= 0 && i > errorPosition - 50;
            i--
          ) {
            const char = fixedJson[i];
            // If we find a quote, }, ], digit, or letter (part of true/false/null), insert comma after it
            if (
              char === '"' ||
              char === "}" ||
              char === "]" ||
              /\d/.test(char) ||
              /[a-z]/.test(char)
            ) {
              // Check if there's already a comma or whitespace
              let j = i + 1;
              while (j < fixedJson.length && /\s/.test(fixedJson[j])) j++;
              if (j < fixedJson.length && fixedJson[j] !== ",") {
                insertPos = j;
                break;
              }
            }
          }

          // Only insert comma if we found a good position and there's no comma already
          if (insertPos < errorPosition && fixedJson[insertPos] !== ",") {
            fixedJson =
              fixedJson.substring(0, insertPos) +
              "," +
              fixedJson.substring(insertPos);
            try {
              const parsed = JSON.parse(fixedJson);
              console.log(
                "✅ Successfully fixed and parsed JSON on first retry"
              );
              return validateAndFormatLessonPlan(parsed, input);
            } catch (retryError) {
              // If quick fix didn't work, continue to full retry logic
            }
          }
        }
      }

      // Log as warning instead of error since we'll try to fix it
      console.warn(
        "⚠️ JSON parsing issue detected (will attempt to fix):",
        parseError.message
      );

      // Extract position from error message if available
      const positionMatch = parseError.message?.match(/position (\d+)/);
      const errorPosition = positionMatch ? parseInt(positionMatch[1]) : -1;

      // Only log detailed context in debug mode or if error position is available
      if (
        errorPosition > 0 &&
        errorPosition < responseText.length &&
        process.env.DEBUG
      ) {
        const start = Math.max(0, errorPosition - 200);
        const end = Math.min(responseText.length, errorPosition + 200);
        console.warn("Context around error position:");
        console.warn("..." + responseText.substring(start, errorPosition));
        console.warn(">>> ERROR HERE <<<");
        console.warn(responseText.substring(errorPosition, end) + "...");
      }

      // Try to extract and fix JSON more aggressively
      try {
        // Check if response is empty
        if (!responseText || responseText.trim().length < 10) {
          throw new Error("Response text is empty, cannot parse JSON");
        }

        let jsonText = extractJsonFromText(responseText);
        jsonText = cleanEllipsis(jsonText);

        // Check again
        if (!jsonText || jsonText.length < 10) {
          throw new Error("Response text is empty after removing markdown");
        }

        // Find the JSON object
        const startIdx = jsonText.indexOf("{");
        let lastIdx = jsonText.lastIndexOf("}");

        if (startIdx === -1) {
          throw new Error("No opening brace found in response");
        }

        // If JSON seems incomplete (no closing brace or incomplete), try to fix it
        if (startIdx !== -1) {
          if (lastIdx === -1 || lastIdx <= startIdx) {
            // JSON might be incomplete - try to find where it should end
            // Count braces to find the proper closing
            let braceCount = 0;
            let inString = false;
            let escapeNext = false;

            for (let i = startIdx; i < jsonText.length; i++) {
              const char = jsonText[i];

              if (escapeNext) {
                escapeNext = false;
                continue;
              }

              if (char === "\\") {
                escapeNext = true;
                continue;
              }

              if (char === '"' && !escapeNext) {
                inString = !inString;
                continue;
              }

              if (!inString) {
                if (char === "{") braceCount++;
                if (char === "}") {
                  braceCount--;
                  if (braceCount === 0) {
                    lastIdx = i;
                    break;
                  }
                }
              }
            }

            // If still incomplete, try to close it properly
            if (braceCount > 0) {
              // Close all open braces and strings
              while (braceCount > 0) {
                jsonText += "}";
                braceCount--;
              }
              lastIdx = jsonText.length - 1;
            }
          }

          if (lastIdx !== -1 && lastIdx > startIdx) {
            jsonText = jsonText.substring(startIdx, lastIdx + 1);
          } else if (startIdx !== -1) {
            // At least extract from start
            jsonText = jsonText.substring(startIdx);
            // Try to close it
            if (!jsonText.endsWith("}")) {
              // Count open braces and close them
              const openBraces = (jsonText.match(/\{/g) || []).length;
              const closeBraces = (jsonText.match(/\}/g) || []).length;
              const needed = openBraces - closeBraces;
              for (let i = 0; i < needed; i++) {
                jsonText += "}";
              }
            }
          }
        }

        // Fix common JSON syntax errors before fixing control characters
        // Fix missing commas between properties (comprehensive fix)
        jsonText = jsonText.replace(/("\s*)\n\s*(")/g, "$1,\n$2"); // Missing comma between string properties
        jsonText = jsonText.replace(/("\s*)\n\s*(\[)/g, "$1,\n$2"); // Missing comma before array
        jsonText = jsonText.replace(/("\s*)\n\s*(\{)/g, "$1,\n$2"); // Missing comma before object
        jsonText = jsonText.replace(/(\]\s*)\n\s*(")/g, "$1,\n$2"); // Missing comma after array
        jsonText = jsonText.replace(/(\}\s*)\n\s*(")/g, "$1,\n$2"); // Missing comma after object
        jsonText = jsonText.replace(/(\d+)\s*\n\s*(")/g, "$1,\n$2"); // Missing comma after number
        jsonText = jsonText.replace(/(true|false|null)\s*\n\s*(")/g, "$1,\n$2"); // Missing comma after boolean/null

        // Fix missing commas without newlines (be careful not to break valid JSON)
        // Only fix when we have clear patterns that indicate missing commas
        jsonText = jsonText.replace(/(\})\s+(")/g, "$1,$2"); // Object followed by string property (with space)
        jsonText = jsonText.replace(/(\])\s+(")/g, "$1,$2"); // Array followed by string property (with space)
        jsonText = jsonText.replace(/(\d+)\s+(")/g, "$1,$2"); // Number followed by string property (with space)
        jsonText = jsonText.replace(/(true|false|null)\s+(")/g, "$1,$2"); // Boolean/null followed by string property (with space)

        // Remove duplicate commas and trailing commas
        jsonText = jsonText.replace(/,\s*,/g, ","); // Remove duplicate commas
        jsonText = jsonText.replace(/,\s*([}\]])/g, "$1"); // Remove trailing commas

        // Fix control characters in JSON strings
        // This function escapes control characters that are inside string literals
        let fixedJson = "";
        let inString = false;
        let escapeCount = 0; // Count consecutive backslashes

        for (let i = 0; i < jsonText.length; i++) {
          const char = jsonText[i];

          if (char === "\\") {
            escapeCount++;
            fixedJson += char;
            continue;
          }

          if (char === '"') {
            // Check if this quote is escaped (odd number of backslashes before it)
            if (escapeCount % 2 === 0) {
              // Not escaped - toggle string state
              inString = !inString;
            }
            escapeCount = 0;
            fixedJson += char;
            continue;
          }

          // Reset escape count for non-backslash, non-quote characters
          escapeCount = 0;

          if (inString) {
            // Inside a string - escape control characters
            const charCode = char.charCodeAt(0);
            if (char === "\n") {
              fixedJson += "\\n";
            } else if (char === "\r") {
              fixedJson += "\\r";
            } else if (char === "\t") {
              fixedJson += "\\t";
            } else if (charCode < 32 || charCode === 127) {
              // Other control characters - remove them or replace with space
              fixedJson += " ";
            } else {
              fixedJson += char;
            }
          } else {
            // If we're outside a string and encounter end of input, close any open strings
            if (i === jsonText.length - 1 && inString) {
              fixedJson += '"';
              inString = false;
            }
            // Outside a string - keep whitespace but remove other control chars
            const charCode = char.charCodeAt(0);
            if (
              char === "\n" ||
              char === "\r" ||
              char === "\t" ||
              char === " "
            ) {
              fixedJson += char;
            } else if (charCode >= 32 && charCode !== 127) {
              fixedJson += char;
            }
            // Skip other control characters outside strings
          }
        }

        // Close any remaining open strings or structures
        if (inString) {
          fixedJson += '"';
        }

        // Ensure JSON is properly closed
        const openBraces = (fixedJson.match(/\{/g) || []).length;
        const closeBraces = (fixedJson.match(/\}/g) || []).length;
        const needed = openBraces - closeBraces;
        for (let i = 0; i < needed; i++) {
          fixedJson += "}";
        }

        const parsed = JSON.parse(fixedJson);
        console.log(
          "✅ Successfully fixed and parsed JSON on second attempt (initial parse had minor formatting issues)"
        );
        return validateAndFormatLessonPlan(parsed, input);
      } catch (secondParseError: any) {
        console.error("Second parse attempt also failed:", secondParseError);
        console.error("Second error position:", secondParseError.message);

        // Try one more time with even more aggressive fixes
        try {
          let jsonText = extractJsonFromText(responseText);
          jsonText = cleanEllipsis(jsonText);

          const startIdx = jsonText.indexOf("{");
          const lastIdx = jsonText.lastIndexOf("}");
          if (startIdx !== -1 && lastIdx > startIdx) {
            jsonText = jsonText.substring(startIdx, lastIdx + 1);
          }

          // More aggressive fixes for missing commas
          jsonText = jsonText.replace(/,\s*,/g, ","); // Remove duplicate commas
          jsonText = jsonText.replace(/,\s*([}\]])/g, "$1"); // Remove trailing commas
          jsonText = jsonText.replace(/([}\]"])\s*\n\s*(")/g, "$1,\n$2"); // Missing comma between properties
          jsonText = jsonText.replace(/([}\]"])\s*\n\s*(\[)/g, "$1,\n$2");
          jsonText = jsonText.replace(/([}\]"])\s*\n\s*(\{)/g, "$1,\n$2");

          // Clean up control characters
          let finalJson = "";
          let inStringFinal = false;
          let escapeNextFinal = false;

          for (let i = 0; i < jsonText.length; i++) {
            const char = jsonText[i];

            if (escapeNextFinal) {
              finalJson += char;
              escapeNextFinal = false;
              continue;
            }

            if (char === "\\") {
              finalJson += char;
              escapeNextFinal = true;
              continue;
            }

            if (char === '"') {
              inStringFinal = !inStringFinal;
              finalJson += char;
              continue;
            }

            if (inStringFinal) {
              const charCode = char.charCodeAt(0);
              if (char === "\n") {
                finalJson += "\\n";
              } else if (char === "\r") {
                finalJson += "\\r";
              } else if (char === "\t") {
                finalJson += "\\t";
              } else if (charCode < 32 || charCode === 127) {
                finalJson += " ";
              } else {
                finalJson += char;
              }
            } else {
              const charCode = char.charCodeAt(0);
              if (char.match(/[\s\w\d\{\}\[\]":,.\-+]/)) {
                finalJson += char;
              } else if (char === "\n" || char === "\t" || char === "\r") {
                finalJson += " ";
              }
            }
          }

          // Close any open structures
          if (inStringFinal) {
            finalJson += '"';
          }
          const openBraces = (finalJson.match(/\{/g) || []).length;
          const closeBraces = (finalJson.match(/\}/g) || []).length;
          const needed = openBraces - closeBraces;
          for (let i = 0; i < needed; i++) {
            finalJson += "}";
          }

          const parsed = JSON.parse(finalJson);
          console.log("✅ Successfully parsed JSON on third attempt");
          return validateAndFormatLessonPlan(parsed, input);
        } catch (thirdParseError) {
          console.error("Third parse attempt also failed:", thirdParseError);

          // Log response details
          if (responseText && responseText.length > 0) {
            console.error("Response text length:", responseText.length);
            console.error(
              "Response text (first 2000 chars):",
              responseText.substring(0, Math.min(2000, responseText.length))
            );
            console.error(
              "Response text (last 500 chars):",
              responseText.substring(Math.max(0, responseText.length - 500))
            );

            // Log the problematic JSON section if we have position info
            if (errorPosition > 0 && errorPosition < responseText.length) {
              const problemStart = Math.max(0, errorPosition - 100);
              const problemEnd = Math.min(
                responseText.length,
                errorPosition + 100
              );
              console.error("Problematic JSON section:");
              console.error(responseText.substring(problemStart, problemEnd));
            }
          } else {
            console.error("❌ Response text is empty or null");
            console.error("This might indicate:");
            console.error("1. Gemini API returned an empty response");
            console.error("2. Response was truncated or cut off");
            console.error("3. Network/connection issue");
          }

          return generateMockLessonPlan(input);
        }
      }
    }
  } catch (error: any) {
    console.error("Error generating lesson plan with Gemini:", error);
    // Fallback to mock service on error
    return generateMockLessonPlan(input);
  }
};

/**
 * Build prompt for Gemini according to Công văn 2345
 */
const buildPrompt = (
  input: LessonPlanInput,
  fileContext: string,
  imageCount: number = 0
): string => {
  const {
    teacherName,
    subject,
    grade,
    educationLevel,
    lessonTitle,
    duration,
    template,
  } = input;

  // Chế độ đặc biệt: Công văn 2345 với cấu trúc JSON chi tiết hơn
  if (template === "2345") {
    const soTiet = Math.max(1, Math.round(duration / 35));
    return `Bạn là một Trợ lý AI chuyên môn, có khả năng soạn thảo Kế hoạch Bài Dạy (Giáo án) theo chuẩn mực giáo dục Việt Nam và Công văn 2345/BGDĐT-GDTrH. Nhiệm vụ của bạn là soạn thảo một Kế hoạch Bài Dạy hoàn chỉnh theo đúng form mẫu và định dạng chi tiết.

THÔNG TIN ĐẦU VÀO:
- Giáo viên: ${teacherName}
- Môn học: ${subject}
- Tên bài học: ${lessonTitle}
- Lớp: ${grade}
- Cấp học: ${educationLevel}
- Thời lượng: ${duration} phút (tương đương ${soTiet} tiết)

NỘI DUNG THAM KHẢO TỪ TÀI LIỆU ĐÃ UPLOAD (NẾU CÓ):
${fileContext || "Không có tài liệu được upload"}

HÌNH ẢNH ĐÃ UPLOAD (NẾU CÓ):
${
  imageCount > 0
    ? `Có ${imageCount} hình ảnh đã được upload. Hãy xem kỹ các hình ảnh này để hiểu nội dung bài học cần soạn giáo án. Nếu hình ảnh chứa nội dung bài học, bài tập, hoặc tài liệu tham khảo, hãy sử dụng thông tin đó để soạn giáo án phù hợp.`
    : "Không có hình ảnh được upload"
}

**HƯỚNG DẪN SỬ DỤNG TÀI LIỆU VÀ HÌNH ẢNH:**
- Nếu có file PDF/DOCX: Sử dụng nội dung trong file làm bài mẫu, tham khảo cấu trúc và nội dung để soạn giáo án
- Nếu có hình ảnh: Xem kỹ hình ảnh để hiểu nội dung bài học, bài tập, hoặc tài liệu cần dạy. Soạn giáo án dựa trên nội dung trong hình ảnh
- Kết hợp cả file và hình ảnh: Nếu có cả file và hình ảnh, sử dụng file làm bài mẫu và hình ảnh để hiểu rõ hơn về nội dung cần dạy
- KHÔNG sao chép nguyên văn: Chỉ tham khảo cấu trúc và nội dung, sau đó soạn lại theo phong cách và yêu cầu của giáo án

═══════════════════════════════════════════════════════════════════════════════
1. YÊU CẦU VỀ CẤU TRÚC VÀ NỘI DUNG (BỐ CỤC)
═══════════════════════════════════════════════════════════════════════════════

PHẦN MỞ ĐẦU (TIÊU ĐỀ):
- Trình bày thông tin trên cùng: TRƯỜNG SƯ PHẠM - TRƯỜNG ĐẠI HỌC VINH, KHOA GIÁO DỤC TIỂU HỌC (hoặc tương tự)
- Tiêu đề chính: **KẾ HOẠCH BÀI DẠY** (căn giữa, in đậm)
- Thông tin Bài học: **MÔN ${subject.toUpperCase()} LỚP ${grade}**, (Bộ sách Kết nối tri thức), **CHỦ ĐỀ X, BÀI Y** hoặc **BÀI: ${lessonTitle}**
- Thông tin cá nhân (placeholder): Sinh viên thực hiện, Lớp học phần, Giảng viên

I. YÊU CẦU CẦN ĐẠT:
**RẤT QUAN TRỌNG:** Phần I chỉ có 3 mục con (KHÔNG có phần "Kiến thức"):
1. **Năng lực đặc thù** (dựa vào mục tiêu của bài, gắn với môn ${subject})
   - Mỗi năng lực đặc thù phải được liệt kê bằng dấu gạch đầu dòng (-)
   - Ví dụ: - Nêu được một số biểu hiện..., - Hiểu được vì sao..., - Thực hiện được hành vi...
2. **Năng lực chung** (Tự chủ, tự học, giao tiếp, hợp tác, giải quyết vấn đề)
   - Mỗi năng lực chung phải được liệt kê bằng dấu gạch đầu dòng (-)
   - Ví dụ: - Biết trao đổi, thảo luận, chia sẻ ý kiến..., - Vận dụng kiến thức đã học...
3. **Phẩm chất** (Yêu nước, nhân ái, chăm chỉ, trung thực, trách nhiệm)
   - Mỗi phẩm chất phải được liệt kê bằng dấu gạch đầu dòng (-)
   - Có thể gộp nhiều phẩm chất trong một dòng: - Trách nhiệm: Có ý thức..., - Chăm chỉ, trung thực: Trung thực...

Yêu cầu AI tự xây dựng các nội dung chi tiết dựa trên tên bài học "${lessonTitle}".

II. ĐỒ DÙNG DẠY HỌC:
**RẤT QUAN TRỌNG:** Format phải là một dòng duy nhất cho mỗi phần (KHÔNG phải list):
- **Giáo viên:** [liệt kê TẤT CẢ thiết bị, đồ dùng cho giáo viên trong MỘT dòng, cách nhau bằng dấu phẩy hoặc dấu chấm phẩy]
- **Học sinh:** [liệt kê TẤT CẢ thiết bị, đồ dùng cho học sinh trong MỘT dòng, cách nhau bằng dấu phẩy hoặc dấu chấm phẩy]

Ví dụ đúng format:
- Giáo viên: SGK, SGV, Vở bài tập Đạo đức 5; Máy tính, máy chiếu; Các phiếu học tập, thẻ trò chơi (Xanh/Đỏ/Vàng), hộp quà bí mật, các mảnh ghép cho trò chơi, Phiếu rèn luyện.
- Học sinh: Sách Đạo đức 5, Đồ dùng học tập: vở, bút, hồ dán.

III. CÁC HOẠT ĐỘNG DẠY HỌC:
**RẤT QUAN TRỌNG - PHẦN NÀY BẮT BUỘC PHẢI CÓ NỘI DUNG:**
- Phân chia rõ ràng thành các **TIẾT** (ví dụ: **TIẾT 1**, **TIẾT 2**, **TIẾT 3**, **TIẾT 4**). Số tiết phải khớp với yêu cầu: ${soTiet} tiết.
- PHẢI tạo đầy đủ ${soTiet} tiết với nội dung chi tiết, KHÔNG được để trống hoặc dùng dấu chấm làm placeholder.
- Mỗi tiết PHẢI có đầy đủ 3 hoạt động: Khởi động, Khám phá, Luyện tập/Vận dụng.

Trong mỗi **TIẾT**, sử dụng **MỘT BẢNG 2 CỘT DUY NHẤT** cho TẤT CẢ các hoạt động trong tiết đó:
- Cột 1: **Hoạt động của GV** (Giáo viên)
- Cột 2: **Hoạt động của HS** (Học sinh)
- **RẤT QUAN TRỌNG:** TẤT CẢ 3 hoạt động trong 1 tiết PHẢI nằm trong CÙNG 1 BẢNG, KHÔNG được tách thành nhiều bảng riêng biệt

Mỗi tiết phải gồm ĐẦY ĐỦ 3 hoạt động sau (in đậm, đánh số thứ tự):
1. **HOẠT ĐỘNG KHỞI ĐỘNG**
2. **HOẠT ĐỘNG KHÁM PHÁ**
3. **HOẠT ĐỘNG LUYỆN TẬP/VẬN DỤNG**

Cấu trúc bảng cho MỘT TIẾT (tất cả 3 hoạt động trong cùng 1 bảng):
| **Hoạt động của GV** | **Hoạt động của HS** |
|----------------------|----------------------|
| **1. HOẠT ĐỘNG KHỞI ĐỘNG** | |
| **- Mục tiêu:** Tạo hứng thú... | |
| **- Cách tiến hành:** | |
| GV đặt câu hỏi: *"Các em thấy gì?"* | HS quan sát và trả lời |
| GV hướng dẫn HS... | HS thảo luận... |
| **=> GV Kết luận:** *"Các em đã..."* | HS lắng nghe và ghi nhớ |
| **2. HOẠT ĐỘNG KHÁM PHÁ** | |
| **- Mục tiêu:** Giúp HS nhận biết... | |
| **- Cách tiến hành:** | |
| GV trình bày nội dung... | HS lắng nghe... |
| GV hướng dẫn HS... | HS làm việc nhóm... |
| **=> GV Kết luận:** *"Các em đã..."* | HS lắng nghe và ghi nhớ |
| **3. HOẠT ĐỘNG LUYỆN TẬP/VẬN DỤNG** | |
| **- Mục tiêu:** Củng cố kiến thức... | |
| **- Cách tiến hành:** | |
| GV hướng dẫn HS làm bài tập... | HS thực hành... |
| GV quan sát, hỗ trợ... | HS trình bày kết quả... |
| **=> GV Kết luận:** *"Các em đã..."* | HS lắng nghe và ghi nhớ |

**LƯU Ý QUAN TRỌNG:**
- Mỗi hoạt động bắt đầu bằng hàng có tên hoạt động (ví dụ: **1. HOẠT ĐỘNG KHỞI ĐỘNG**)
- Sau đó là **- Mục tiêu:**, **- Cách tiến hành:**, các bước thực hiện, và **=> GV Kết luận:**
- Tất cả 3 hoạt động phải nằm liên tiếp trong cùng 1 bảng, không có dòng trống hoặc separator giữa các hoạt động

IV. ĐIỀU CHỈNH SAU BÀI DẠY:
- **Nhận xét chung:** CHỈ điền khoảng 50-100 dấu chấm (ví dụ: "................................................................................"), KHÔNG đưa bất kỳ nội dung nào khác như HTML tags, tên chủ đề, tên bài học, hoặc văn bản. CHỈ dấu chấm.

═══════════════════════════════════════════════════════════════════════════════
2. YÊU CẦU VỀ ĐỊNH DẠNG VÀ HÌNH THỨC (FORMAT)
═══════════════════════════════════════════════════════════════════════════════

Font chữ: Sử dụng Times New Roman xuyên suốt văn bản (ghi chú: nếu không thể hiển thị, dùng font chữ mặc định chuẩn cho văn bản học thuật).

Căn lề (Alignment): 
- Toàn bộ văn bản phải được căn đều hai bên (Justify).
- Các tiêu đề lớn có thể căn giữa (ví dụ: **KẾ HOẠCH BÀI DẠY**).

In Đậm (Bold):
- In đậm các tiêu đề lớn: **KẾ HOẠCH BÀI DẠY**, **I. YÊU CẦU CẦN ĐẠT**, **II. ĐỒ DÙNG DẠY HỌC**, **TIẾT X**
- In đậm các tiêu đề hoạt động chính: **1. HOẠT ĐỘNG KHỞI ĐỘNG**, **2. HOẠT ĐỘNG KHÁM PHÁ**
- In đậm các từ khóa quan trọng trong hoạt động: **- Mục tiêu**, **- Cách tiến hành**, **=> GV Kết luận**

Bảng (Table):
- Bảng 2 cột cho phần III. CÁC HOẠT ĐỘNG DẠY HỌC phải có đường kẻ rõ ràng (border visible).
- Nội dung trong bảng cần được sắp xếp gọn gàng, sử dụng dấu gạch đầu dòng (- hoặc *) để liệt kê hành động của GV/HS.
- Mỗi hàng trong bảng tương ứng với một bước trong quá trình dạy học.

In nghiêng (Italic):
- Sử dụng *in nghiêng* cho lời thoại của giáo viên: *"Các em hãy quan sát..."*
- Sử dụng *in nghiêng* cho các câu hỏi, gợi ý: *"Các em thấy gì trong hình?"*

═══════════════════════════════════════════════════════════════════════════════
3. YÊU CẦU VỀ CÁCH VIẾT
═══════════════════════════════════════════════════════════════════════════════

- Sử dụng các phương pháp dạy học tích cực (trò chơi, thảo luận nhóm, sắm vai, sơ đồ tư duy, …) và nêu rõ ở từng hoạt động.
- Gợi ý lời thoại của Giáo viên tự nhiên, sư phạm, khơi gợi hứng thú.
- Nội dung phải phù hợp với lứa tuổi học sinh ${educationLevel}, đúng chuẩn kiến thức – kĩ năng GDPT 2018.
- **BẮT BUỘC:** Mỗi tiết PHẢI có đầy đủ 3 hoạt động: 1. Khởi động, 2. Khám phá, 3. Luyện tập/Vận dụng. KHÔNG được thiếu bất kỳ hoạt động nào.
- **BẮT BUỘC:** Tất cả 3 hoạt động trong 1 tiết PHẢI được trình bày trong CÙNG 1 BẢNG, không được tách thành nhiều bảng riêng biệt.

═══════════════════════════════════════════════════════════════════════════════
4. ĐỊNH DẠNG JSON KẾT QUẢ
═══════════════════════════════════════════════════════════════════════════════

RẤT QUAN TRỌNG: Chỉ trả về MỘT đối tượng JSON hợp lệ, không thêm bất kỳ giải thích hay văn bản ngoài JSON nào.

LƯU Ý VỀ ĐỊNH DẠNG JSON:
- JSON phải hợp lệ 100%, không có lỗi syntax
- JSON phải HOÀN CHỈNH - đóng tất cả các dấu ngoặc nhọn { }, ngoặc vuông [ ], và dấu ngoặc kép "
- Tất cả các ký tự đặc biệt trong string phải được escape đúng cách (\\n cho newline, \\t cho tab, \\" cho dấu ngoặc kép)
- Không được có ký tự control (newline, tab thực sự) trong string literals - phải dùng \\n, \\t
- Phần "nhan_xet" nên để ngắn gọn (khoảng 100-150 dấu chấm), không tạo quá nhiều dấu chấm
- Đảm bảo tất cả các mảng và object đều được đóng đúng cách
- Nếu response quá dài, ưu tiên tính đúng đắn của JSON hơn là độ dài nội dung

Cấu trúc JSON phải tuân thủ chặt chẽ:

{
  "thong_tin_bai_hoc": {
    "mon_hoc": "${subject}",
    "ten_bai": "${lessonTitle}",
    "lop": "${grade}",
    "bo_sach": "Kết nối tri thức",
    "thoi_luong_tiet": ${soTiet}
  },
  "thong_tin_mo_dau": {
    "truong": "TRƯỜNG SƯ PHẠM - TRƯỜNG ĐẠI HỌC VINH",
    "khoa": "KHOA GIÁO DỤC TIỂU HỌC",
    "sinh_vien": "[Tên sinh viên]",
    "lop_hoc_phan": "[Lớp học phần]",
    "giang_vien": "[Tên giảng viên]"
  },
  "yeu_cau_can_dat": {
    "nang_luc_dac_thu": [ "- Nêu được một số biểu hiện...", "- Hiểu được vì sao...", "- Thực hiện được hành vi..." ],
    "nang_luc_chung": [ "- Biết trao đổi, thảo luận, chia sẻ ý kiến...", "- Vận dụng kiến thức đã học..." ],
    "pham_chat": [ "- Trách nhiệm: Có ý thức...", "- Chăm chỉ, trung thực: Trung thực..." ]
  },
  "do_dung_day_hoc": {
    "giao_vien": [ "SGK, SGV, Vở bài tập Đạo đức 5; Máy tính, máy chiếu; Các phiếu học tập, thẻ trò chơi (Xanh/Đỏ/Vàng), hộp quà bí mật, các mảnh ghép cho trò chơi, Phiếu rèn luyện" ],
    "hoc_sinh": [ "Sách Đạo đức 5, Đồ dùng học tập: vở, bút, hồ dán" ]
  },
  "hoat_dong_day_hoc": {
    "tiet_1": {
      "hoat_dong_khoi_dong": {
        "muc_tieu": [ "Mục tiêu 1 của hoạt động khởi động", "Mục tiêu 2..." ],
        "to_chuc": {
          "giao_vien": [ "GV đặt câu hỏi: *\"Các em thấy gì?\"*", "GV hướng dẫn HS...", "**=> GV Kết luận:** *\"Các em đã...\"*" ],
          "hoc_sinh": [ "HS quan sát và trả lời", "HS thảo luận nhóm...", "HS lắng nghe và ghi nhớ" ]
        }
      },
      "hoat_dong_kham_pha": {
        "muc_tieu": [ "Mục tiêu của hoạt động khám phá" ],
        "to_chuc": {
          "giao_vien": [ "GV trình bày...", "GV giải thích...", "**=> GV Kết luận:** ..." ],
          "hoc_sinh": [ "HS lắng nghe...", "HS ghi chép...", "HS lắng nghe và ghi nhớ" ]
        }
      },
      "hoat_dong_luyen_tap": {
        "muc_tieu": [ "Mục tiêu của hoạt động luyện tập" ],
        "to_chuc": {
          "giao_vien": [ "GV hướng dẫn...", "GV quan sát, hỗ trợ...", "**=> GV Kết luận:** ..." ],
          "hoc_sinh": [ "HS thực hành...", "HS trình bày...", "HS lắng nghe và ghi nhớ" ]
        }
      }
    },
    "tiet_2": { /* cấu trúc giống tiet_1 */ },
    "tiet_3": { /* cấu trúc giống tiet_1 */ }
    /* ... tiếp tục cho ${soTiet} tiết */
  },
  "dieu_chinh_sau_bai_day": {
    "nhan_xet": "................................................................................"
  }
  
**LƯU Ý VỀ "nhan_xet":**
- CHỈ điền dấu chấm (khoảng 50-100 dấu chấm)
- KHÔNG đưa HTML tags, tên chủ đề, tên bài học, hoặc bất kỳ văn bản nào khác
- KHÔNG đưa nội dung từ "thong_tin_bai_hoc" hoặc các phần khác vào đây
- Ví dụ đúng: "................................................................................"
- Ví dụ SAI: "<span>CHỦ ĐỀ 1: ÔN TẬP</span>" hoặc "BÀI: ÔN TẬP SỐ TỰ NHIÊN"
}

LƯU Ý CỰC KỲ QUAN TRỌNG VỀ ĐỊNH DẠNG TRONG JSON:
- **PHẦN "hoat_dong_day_hoc" LÀ BẮT BUỘC VÀ PHẢI CÓ NỘI DUNG ĐẦY ĐỦ:**
  + PHẢI tạo đầy đủ ${soTiet} tiết (tiet_1, tiet_2, ... tiet_${soTiet})
  + Mỗi tiết PHẢI có đầy đủ 3 hoạt động: hoat_dong_khoi_dong, hoat_dong_kham_pha, hoat_dong_luyen_tap
  + Mỗi hoạt động PHẢI có nội dung chi tiết, cụ thể, KHÔNG được để trống hoặc dùng "..." làm placeholder
  + Mỗi hoạt động PHẢI có: muc_tieu (mảng), to_chuc.giao_vien (mảng), to_chuc.hoc_sinh (mảng)
  + **QUAN TRỌNG:** Khi hiển thị, TẤT CẢ 3 hoạt động trong 1 tiết sẽ được gộp vào CÙNG 1 BẢNG, không tách riêng
  
- Trong trường "to_chuc.giao_vien" và "to_chuc.hoc_sinh", bạn PHẢI sử dụng markdown:
  + **In đậm** cho các từ khóa: **=> GV Kết luận** (KHÔNG đưa "**- Mục tiêu:**" và "**- Cách tiến hành:**" vào đây vì hệ thống sẽ tự thêm)
  + *In nghiêng* cho lời thoại: *"Các em hãy quan sát..."*
  + Số thứ tự: 1., 2., 3. hoặc Bước 1:, Bước 2:
- **QUAN TRỌNG:** Trong mảng "to_chuc.giao_vien" và "to_chuc.hoc_sinh", CHỈ đưa các bước thực hiện cụ thể (ví dụ: "GV đặt câu hỏi...", "HS quan sát..."). KHÔNG đưa "**- Mục tiêu:**" hoặc "**- Cách tiến hành:**" vào đây vì hệ thống sẽ tự động thêm các header này.
- Mỗi phần tử trong mảng "giao_vien" và "hoc_sinh" tương ứng với nhau (cùng bước trong bảng)
- Nội dung phải cụ thể, chi tiết, phù hợp với bài học "${lessonTitle}", KHÔNG được dùng dấu chấm hoặc placeholder

- **QUAN TRỌNG VỀ "dieu_chinh_sau_bai_day.nhan_xet":**
  + CHỈ điền dấu chấm (khoảng 50-100 dấu chấm): "................................................................................"
  + KHÔNG đưa HTML tags, tên chủ đề, tên bài học, hoặc bất kỳ văn bản nào khác
  + KHÔNG copy nội dung từ các phần khác (thong_tin_bai_hoc, v.v.) vào đây
  + Đây là phần để giáo viên tự điền nhận xét sau khi dạy, nên chỉ cần dấu chấm làm placeholder

Nếu không thể tuân thủ đúng JSON trên, hãy trả về lỗi JSON tối giản:
{ "error": "Không thể tạo giáo án" }`;
  }

  // Mặc định cho các mẫu khác (giữ như cũ để không phá vỡ hành vi hiện tại)
  return `Bạn là một chuyên gia giáo dục Việt Nam. Hãy tạo một giáo án chi tiết theo Công văn ${template} của Bộ Giáo dục và Đào tạo.

THÔNG TIN ĐẦU VÀO:
- Giáo viên: ${teacherName}
- Môn học: ${subject}
- Lớp: ${grade}
- Cấp học: ${educationLevel}
- Thời gian: ${duration} phút
- Tên bài học: ${lessonTitle}
${fileContext}

YÊU CẦU:
Tạo giáo án theo đúng cấu trúc Công văn ${template} với các phần sau:

I. MỤC TIÊU BÀI HỌC:
1. Kiến thức: Mô tả kiến thức học sinh cần đạt được
2. Năng lực:
   - Năng lực chung: Tự chủ, tự học, giao tiếp, hợp tác, giải quyết vấn đề
   - Năng lực đặc thù: Phù hợp với môn ${subject}
3. Phẩm chất: Yêu nước, nhân ái, chăm chỉ, trung thực, trách nhiệm

II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU:
- Giáo viên: Liệt kê thiết bị, tài liệu giáo viên cần
- Học sinh: Liệt kê thiết bị, tài liệu học sinh cần

III. TIẾN TRÌNH DẠY HỌC:
Hoạt động 1: Mở đầu (Khởi động, Xác định vấn đề/nhiệm vụ học tập)
- Thời gian: 5-7 phút
- Mục tiêu, nội dung, phương pháp chi tiết

Hoạt động 2: Hình thành kiến thức mới
- Thời gian: Khoảng ${Math.floor(duration * 0.4)} phút
- Mục tiêu, nội dung, phương pháp chi tiết

Hoạt động 3: Luyện tập (Thực hành, củng cố)
- Thời gian: Khoảng ${Math.floor(duration * 0.3)} phút
- Mục tiêu, nội dung, phương pháp chi tiết

Hoạt động 4: Vận dụng/Tìm tòi mở rộng
- Thời gian: Khoảng ${Math.floor(duration * 0.2)} phút
- Mục tiêu, nội dung, phương pháp chi tiết

LƯU Ý:
- Giáo án phải phù hợp với cấp học ${educationLevel}
- Nội dung phải cụ thể, chi tiết, có thể thực hiện được
- Sử dụng thông tin từ tài liệu đã upload (nếu có) để làm ngữ cảnh
- Phương pháp dạy học phải đa dạng, phù hợp với từng hoạt động
- Đảm bảo tính khoa học, sư phạm và phù hợp với chương trình giáo dục Việt Nam

YÊU CẦU VỀ ĐỊNH DẠNG MARKDOWN (RẤT QUAN TRỌNG):
Khi viết nội dung trong trường "content", bạn PHẢI sử dụng định dạng markdown với:
1. **Bảng 2 cột** để trình bày "Hoạt động của Giáo viên" và "Hoạt động của Học sinh" song song (nếu có):
   | **Hoạt động của Giáo viên** | **Hoạt động của Học sinh** |
   |------------------------------|----------------------------|
   | GV đặt câu hỏi: "Các em thấy...?" | HS quan sát và trả lời |
   | GV hướng dẫn HS làm việc nhóm | HS thảo luận trong nhóm |
   
2. **In đậm** cho các tiêu đề, từ khóa quan trọng: **Mục tiêu**, **Phương pháp**, **Thời gian**, **Nội dung**
3. **In nghiêng** cho lời thoại, ví dụ: *"Các em hãy quan sát..."*
4. **Lists** sử dụng - hoặc 1. cho các bước, nội dung
5. **Bảng thời gian** nếu cần: | Bước | Thời gian | Nội dung |

Hãy trả về kết quả dưới dạng JSON với cấu trúc sau (chỉ trả về JSON, không có markdown hay text khác):

{
  "objectives": {
    "knowledge": "string",
    "competencies": {
      "general": ["string", "string"],
      "specific": ["string", "string"]
    },
    "qualities": ["string", "string"]
  },
  "equipment": {
    "teacher": ["string", "string"],
    "student": ["string", "string"]
  },
  "activities": {
    "activity1": {
      "title": "Hoạt động 1: Mở đầu (Khởi động, Xác định vấn đề)",
      "content": "**Thời gian:** X phút\\n\\n**Mục tiêu:** ...\\n\\n**Nội dung:**\\n- ...\\n\\n**Phương pháp:** ..."
    },
    "activity2": {
      "title": "Hoạt động 2: Hình thành kiến thức mới",
      "content": "**Thời gian:** X phút\\n\\n**Mục tiêu:** ...\\n\\n**Nội dung:**\\n- ...\\n\\n**Phương pháp:** ..."
    },
    "activity3": {
      "title": "Hoạt động 3: Luyện tập (Thực hành, củng cố)",
      "content": "**Thời gian:** X phút\\n\\n**Mục tiêu:** ...\\n\\n**Nội dung:**\\n- ...\\n\\n**Phương pháp:** ..."
    },
    "activity4": {
      "title": "Hoạt động 4: Vận dụng/Tìm tòi mở rộng",
      "content": "**Thời gian:** X phút\\n\\n**Mục tiêu:** ...\\n\\n**Nội dung:**\\n- ...\\n\\n**Phương pháp:** ..."
    }
  }
}`;
};

/**
 * Validate and format lesson plan from Gemini response
 */
const validateAndFormatLessonPlan = (
  parsed: any,
  input: LessonPlanInput
): ILessonPlan["content"] => {
  // Nếu là cấu trúc mới theo Công văn 2345 (JSON có trường thong_tin_bai_hoc, yeu_cau_can_dat,...)
  if (
    parsed &&
    (parsed.thong_tin_bai_hoc ||
      parsed.yeu_cau_can_dat ||
      parsed.hoat_dong_day_hoc)
  ) {
    const yc = parsed.yeu_cau_can_dat || {};
    const doDung = parsed.do_dung_day_hoc || {};
    const hd = parsed.hoat_dong_day_hoc || {};

    const toArray = (v: any): string[] => {
      const arr = Array.isArray(v)
        ? v.map((x) => String(x))
        : typeof v === "string"
        ? [v]
        : [];
      // Remove leading "- " or "-" from each item (format cleanup)
      return arr.map((item: string) => item.trim().replace(/^-\s*/, ""));
    };

    // Hàm thêm một hoạt động vào bảng (không tạo bảng mới, chỉ thêm rows)
    const addActivityToTable = (
      tableRows: string[],
      hoatDong: any,
      tenHoatDong: string
    ): void => {
      if (!hoatDong) {
        tableRows.push(`| **${tenHoatDong}** | |`);
        tableRows.push(`| *Chưa có nội dung* | |`);
        return;
      }

      const mucTieu = toArray(hoatDong.muc_tieu);
      const gv = toArray(hoatDong.to_chuc?.giao_vien);
      const hs = toArray(hoatDong.to_chuc?.hoc_sinh);

      // Hàng 1: Tên hoạt động
      tableRows.push(`| **${tenHoatDong}** | |`);

      // Hàng 2: Mục tiêu
      const mucTieuText =
        mucTieu.length > 0 ? mucTieu.map((m) => m.trim()).join(" ") : "...";
      tableRows.push(`| **- Mục tiêu:** ${mucTieuText} | |`);

      // Hàng 3: Cách tiến hành
      tableRows.push(`| **- Cách tiến hành:** | |`);

      // Các hàng tiếp theo: Các bước thực hiện
      // Lọc bỏ các rows có chứa "Mục tiêu" hoặc "Cách tiến hành" vì đã thêm ở trên
      if (gv.length > 0 || hs.length > 0) {
        const maxRows = Math.max(gv.length, hs.length);
        for (let i = 0; i < maxRows; i++) {
          const gvText = gv[i] || "";
          const hsText = hs[i] || "";

          // Bỏ qua các rows có chứa "Mục tiêu" hoặc "Cách tiến hành" (đã thêm ở trên)
          const gvLower = gvText.toLowerCase();
          if (
            gvLower.includes("mục tiêu") ||
            gvLower.includes("cách tiến hành")
          ) {
            // Nếu là row "Mục tiêu" hoặc "Cách tiến hành", bỏ qua
            continue;
          }

          // Escape pipe characters in content
          const gvEscaped = gvText.replace(/\|/g, "\\|");
          const hsEscaped = hsText.replace(/\|/g, "\\|");
          tableRows.push(`| ${gvEscaped} | ${hsEscaped} |`);
        }
      } else {
        tableRows.push(`| ... | ... |`);
      }

      // Hàng cuối: GV Kết luận (nếu có)
      const ketLuan = gv.find(
        (text: string) =>
          text.includes("GV Kết luận") || text.includes("Kết luận")
      );
      if (!ketLuan) {
        // Thêm hàng kết luận mặc định nếu chưa có
        tableRows.push(`| **=> GV Kết luận:** ... | |`);
      }
    };

    // Hàm format một tiết (gồm 3 hoạt động: khởi động, khám phá, luyện tập)
    // TẤT CẢ hoạt động trong 1 tiết nằm trong CÙNG 1 BẢNG
    const formatTiet = (
      tietData: any,
      soTiet: number,
      totalTiets: number
    ): { title: string; content: string } => {
      // Đảm bảo tietData không null/undefined
      if (!tietData || typeof tietData !== "object") {
        tietData = {};
      }

      // Tạo 1 bảng duy nhất cho tất cả hoạt động trong tiết
      const tableRows: string[] = [];
      tableRows.push("| **Hoạt động của GV** | **Hoạt động của HS** |");
      tableRows.push("|----------------------|----------------------|");

      // Thêm từng hoạt động vào bảng
      addActivityToTable(
        tableRows,
        tietData.hoat_dong_khoi_dong || tietData.hoatDongKhoiDong,
        `1. HOẠT ĐỘNG KHỞI ĐỘNG`
      );

      addActivityToTable(
        tableRows,
        tietData.hoat_dong_kham_pha || tietData.hoatDongKhamPha,
        `2. HOẠT ĐỘNG KHÁM PHÁ`
      );

      addActivityToTable(
        tableRows,
        tietData.hoat_dong_luyen_tap ||
          tietData.hoat_dong_van_dung ||
          tietData.hoatDongLuyenTap ||
          tietData.hoatDongVanDung,
        `3. HOẠT ĐỘNG LUYỆN TẬP/VẬN DỤNG`
      );

      // Luôn hiển thị số tiết: "TIẾT 1 (1 tiết)" hoặc "TIẾT 1 (2 tiết)"
      const title = `TIẾT ${soTiet} (${totalTiets} tiết)`;

      return {
        title,
        content: tableRows.join("\n"),
      };
    };

    // Xử lý cấu trúc mới với các TIẾT
    const soTiet =
      parsed.thong_tin_bai_hoc?.thoi_luong_tiet ||
      Math.max(1, Math.round(input.duration / 35));
    const tietKeys = Object.keys(hd || {}).filter((key) =>
      key.startsWith("tiet_")
    );

    // Log để debug
    console.log("🔍 Debug hoat_dong_day_hoc:", {
      hasHoatDong: !!hd,
      hdKeys: hd ? Object.keys(hd) : [],
      tietKeys,
      soTiet,
    });

    // Tạo activities - Model yêu cầu 4 activities bắt buộc
    let activities: {
      activity1: { title: string; content: string };
      activity2: { title: string; content: string };
      activity3: { title: string; content: string };
      activity4: { title: string; content: string };
    };

    if (tietKeys.length > 0) {
      // Cấu trúc mới: có các tiết
      const sortedTietKeys = tietKeys.sort((a, b) => {
        const numA = parseInt(a.replace("tiet_", "")) || 0;
        const numB = parseInt(b.replace("tiet_", "")) || 0;
        return numA - numB;
      });

      // Format từng tiết
      const formattedTiets = sortedTietKeys.map((key, index) => {
        const tietNum = parseInt(key.replace("tiet_", "")) || index + 1;
        return formatTiet(hd[key], tietNum, tietKeys.length);
      });

      // Tạo activities - Model yêu cầu 4 activities bắt buộc
      // Nếu chỉ có 1 tiết, chỉ activity1 có nội dung, các activity khác để trống
      const emptyActivity = { title: "", content: "" };

      activities = {
        activity1: formattedTiets[0] || emptyActivity,
        activity2: formattedTiets[1] || emptyActivity,
        activity3: formattedTiets[2] || emptyActivity,
        activity4: formattedTiets[3] || emptyActivity,
      };

      // Nếu có nhiều hơn 4 tiết, gộp các tiết còn lại vào activity4
      if (formattedTiets.length > 4) {
        const remainingTiets = formattedTiets
          .slice(4)
          .map((t) => `${t.title}\n\n${t.content}`)
          .join("\n\n---\n\n");
        if (activities.activity4 && activities.activity4.content) {
          activities.activity4.content += "\n\n---\n\n" + remainingTiets;
        } else {
          activities.activity4 = {
            title: `**TIẾT 5+**`,
            content: remainingTiets,
          };
        }
      }
    } else {
      // Fallback: cấu trúc cũ (khoi_dong, kham_pha, luyen_tap, van_dung)
      const formatPhase = (
        title: string,
        activities: any[],
        fallback: string
      ): { title: string; content: string } => {
        if (!Array.isArray(activities) || activities.length === 0) {
          return {
            title,
            content: fallback,
          };
        }

        const blocks = activities.map((act: any, index: number) => {
          const name = act.ten_hoat_dong || `${title} - Hoạt động ${index + 1}`;
          const mucTieu = toArray(act.muc_tieu);
          const pp = toArray(act.phuong_phap);
          const gv = toArray(act.to_chuc?.giao_vien);
          const hs = toArray(act.to_chuc?.hoc_sinh);
          const sp = toArray(act.san_pham);

          // Tạo bảng markdown cho tổ chức hoạt động (2 cột: GV và HS)
          let toChucTable = "";
          if (gv.length > 0 || hs.length > 0) {
            const maxRows = Math.max(gv.length, hs.length);
            const tableRows: string[] = [];
            tableRows.push(
              "| **Hoạt động của Giáo viên** | **Hoạt động của Học sinh** |"
            );
            tableRows.push(
              "|------------------------------|----------------------------|"
            );

            for (let i = 0; i < maxRows; i++) {
              const gvText = gv[i] || "";
              const hsText = hs[i] || "";
              // Escape pipe characters in content
              const gvEscaped = gvText.replace(/\|/g, "\\|");
              const hsEscaped = hsText.replace(/\|/g, "\\|");
              tableRows.push(`| ${gvEscaped} | ${hsEscaped} |`);
            }
            toChucTable = tableRows.join("\n");
          } else {
            toChucTable =
              "| **Hoạt động của Giáo viên** | **Hoạt động của Học sinh** |\n|------------------------------|----------------------------|\n| ... | ... |";
          }

          return [
            `**${name}**`,
            "",
            "**Mục tiêu:**",
            ...(mucTieu.length ? mucTieu.map((m) => `- ${m}`) : ["- ..."]),
            "",
            "**Phương pháp / kĩ thuật:**",
            ...(pp.length ? pp.map((p) => `- ${p}`) : ["- ..."]),
            "",
            "**Tổ chức hoạt động:**",
            "",
            toChucTable,
            "",
            "**Sản phẩm / kết quả:**",
            ...(sp.length ? sp.map((s) => `- ${s}`) : ["- ..."]),
          ].join("\n");
        });

        return {
          title,
          content: blocks.join("\n\n---\n\n"),
        };
      };

      const activity1 = formatPhase(
        "Hoạt động 1: Khởi động (Kết nối)",
        hd.khoi_dong || hd.khoiDong || [],
        "Hoạt động khởi động để tạo hứng thú và kết nối với bài học."
      );
      const activity2 = formatPhase(
        "Hoạt động 2: Khám phá (Hình thành kiến thức mới)",
        hd.kham_pha || hd.khamPha || [],
        "Hoạt động khám phá và hình thành kiến thức mới."
      );
      const activity3 = formatPhase(
        "Hoạt động 3: Luyện tập (Thực hành, củng cố)",
        hd.luyen_tap || hd.luyenTap || [],
        "Hoạt động luyện tập, thực hành và củng cố kiến thức."
      );
      const activity4 = formatPhase(
        "Hoạt động 4: Vận dụng (Trải nghiệm, mở rộng)",
        hd.van_dung || hd.vanDung || [],
        "Hoạt động vận dụng kiến thức vào thực tế và mở rộng."
      );

      activities = {
        activity1,
        activity2,
        activity3,
        activity4,
      };
    }

    // Fallback: Nếu không có activities hoặc activities rỗng, tạo activities mặc định
    if (
      !activities ||
      (!activities.activity1?.content &&
        !activities.activity2?.content &&
        !activities.activity3?.content &&
        !activities.activity4?.content)
    ) {
      console.warn(
        "⚠️ Không tìm thấy hoạt động dạy học, tạo activities mặc định"
      );

      // Tạo một tiết mặc định với 3 hoạt động
      const defaultTiet = formatTiet(
        {
          hoat_dong_khoi_dong: {
            muc_tieu: ["Tạo hứng thú, kích thích tư duy học sinh"],
            to_chuc: {
              giao_vien: [
                "**- Mục tiêu:** Tạo hứng thú, kích thích tư duy học sinh",
                "**- Cách tiến hành:**",
                `GV đặt câu hỏi gợi mở về chủ đề "${input.lessonTitle}"`,
                "GV hướng dẫn HS thảo luận nhóm nhỏ",
                '**=> GV Kết luận:** *"Các em đã kết nối được với bài học..."*',
              ],
              hoc_sinh: [
                "",
                "",
                "HS quan sát và trả lời",
                "HS thảo luận trong nhóm",
                "HS lắng nghe và ghi nhớ",
              ],
            },
          },
          hoat_dong_kham_pha: {
            muc_tieu: ["Học sinh nắm được kiến thức cốt lõi của bài học"],
            to_chuc: {
              giao_vien: [
                "**- Mục tiêu:** Học sinh nắm được kiến thức cốt lõi",
                "**- Cách tiến hành:**",
                `GV trình bày nội dung chính của "${input.lessonTitle}"`,
                "GV hướng dẫn HS đọc sách giáo khoa",
                "GV giải thích, làm rõ các điểm khó hiểu",
                '**=> GV Kết luận:** *"Các em đã nắm được kiến thức cốt lõi..."*',
              ],
              hoc_sinh: [
                "",
                "",
                "HS lắng nghe và quan sát",
                "HS đọc sách giáo khoa, làm việc cá nhân",
                "HS ghi chép, hệ thống hóa kiến thức",
                "HS lắng nghe và ghi nhớ",
              ],
            },
          },
          hoat_dong_luyen_tap: {
            muc_tieu: ["Củng cố kiến thức, rèn luyện kỹ năng"],
            to_chuc: {
              giao_vien: [
                "**- Mục tiêu:** Củng cố kiến thức, rèn luyện kỹ năng",
                "**- Cách tiến hành:**",
                "GV hướng dẫn HS làm bài tập trong sách giáo khoa",
                "GV quan sát, hỗ trợ HS gặp khó khăn",
                "GV chữa bài tập, rút kinh nghiệm",
                '**=> GV Kết luận:** *"Các em đã củng cố được kiến thức..."*',
              ],
              hoc_sinh: [
                "",
                "",
                "HS làm bài tập trong sách giáo khoa",
                "HS thực hành các dạng bài tập",
                "HS trình bày kết quả",
                "HS lắng nghe và ghi nhớ",
              ],
            },
          },
        },
        1,
        1
      );

      activities = {
        activity1: defaultTiet,
        activity2: { title: "", content: "" },
        activity3: { title: "", content: "" },
        activity4: { title: "", content: "" },
      };
    }

    // Xử lý phần IV. ĐIỀU CHỈNH SAU BÀI DẠY
    const dieuChinh = parsed.dieu_chinh_sau_bai_day || {};
    let nhanXet = (dieuChinh.nhan_xet || "").trim();

    // Clean HTML tags và nội dung không phù hợp
    const originalNhanXet = nhanXet;

    // Loại bỏ HTML tags
    nhanXet = nhanXet.replace(/<[^>]*>/g, "");
    // Loại bỏ HTML entities
    nhanXet = nhanXet.replace(/&[a-z]+;/gi, "");
    // Loại bỏ các từ khóa không phù hợp (CHỦ ĐỀ, BÀI, v.v.)
    nhanXet = nhanXet.replace(/CHỦ ĐỀ\s*\d*:.*/gi, "");
    nhanXet = nhanXet.replace(/BÀI:.*/gi, "");
    nhanXet = nhanXet.replace(/ÔN TẬP.*/gi, "");
    // Trim lại sau khi clean
    nhanXet = nhanXet.trim();

    // Kiểm tra xem có HTML tags hoặc nội dung không phù hợp không
    const hasHtmlTags = /<[^>]+>/.test(originalNhanXet);
    const hasInvalidContent = /CHỦ ĐỀ|BÀI:|ÔN TẬP/i.test(originalNhanXet);

    // Nếu có HTML tags hoặc nội dung không phù hợp, hoặc sau khi clean không còn gì, thay bằng dấu chấm
    if (hasHtmlTags || hasInvalidContent || !nhanXet) {
      nhanXet = ".".repeat(50);
    } else {
      // Kiểm tra xem có chứa chữ cái không (nếu có thì không phải chỉ dấu chấm)
      const hasLetters = /[A-Za-zÀ-ỹ]/.test(nhanXet);
      if (hasLetters) {
        // Có chữ cái - có thể là nội dung không phù hợp, thay bằng dấu chấm
        nhanXet = ".".repeat(50);
      } else {
        // Chỉ có dấu chấm và khoảng trắng - giữ lại nhưng giới hạn độ dài
        nhanXet = nhanXet.length > 150 ? nhanXet.substring(0, 150) : nhanXet;
        // Đảm bảo có ít nhất một số dấu chấm
        if (!nhanXet || !/\./.test(nhanXet)) {
          nhanXet = ".".repeat(50);
        }
      }
    }

    const huongDieuChinh = toArray(dieuChinh.huong_dieu_chinh);

    return {
      objectives: {
        knowledge:
          parsed.muc_tieu_chung ||
          `Học sinh nắm được nội dung chính của ${input.lessonTitle}`,
        competencies: {
          general:
            toArray(yc.nang_luc_chung).length > 0
              ? toArray(yc.nang_luc_chung)
              : [
                  "Tự chủ và tự học",
                  "Giao tiếp và hợp tác",
                  "Giải quyết vấn đề và sáng tạo",
                ],
          specific:
            toArray(yc.nang_luc_dac_thu).length > 0
              ? toArray(yc.nang_luc_dac_thu)
              : [`Năng lực đặc thù môn ${input.subject}`],
        },
        qualities:
          toArray(yc.pham_chat).length > 0
            ? toArray(yc.pham_chat)
            : ["Yêu nước", "Nhân ái", "Chăm chỉ", "Trung thực"],
      },
      equipment: {
        // Format: một dòng duy nhất cho mỗi phần (join array thành string)
        teacher:
          toArray(doDung.giao_vien).length > 0
            ? [toArray(doDung.giao_vien).join(", ")]
            : ["Sách giáo khoa, Giáo án điện tử, Máy chiếu"],
        student:
          toArray(doDung.hoc_sinh).length > 0
            ? [toArray(doDung.hoc_sinh).join(", ")]
            : ["Sách giáo khoa, Vở ghi chép, Bút, thước"],
      },
      activities,
      adjustment: {
        nhanXet: nhanXet || "",
        huongDieuChinh: huongDieuChinh.length > 0 ? huongDieuChinh : [],
      },
    };
  }

  // Mặc định: cấu trúc cũ (objectives/equipment/activities) như trước đây
  const toArray = (v: any): string[] => {
    const arr = Array.isArray(v)
      ? v.map((x) => String(x))
      : typeof v === "string"
      ? [v]
      : [];
    // Remove leading "- " or "-" from each item (format cleanup)
    return arr.map((item: string) => item.trim().replace(/^-\s*/, ""));
  };

  // Xử lý phần IV. ĐIỀU CHỈNH SAU BÀI DẠY (nếu có)
  const dieuChinh = parsed.adjustment || parsed.dieu_chinh_sau_bai_day || {};
  let nhanXet = (dieuChinh.nhan_xet || dieuChinh.nhanXet || "").trim();

  // Clean HTML tags và nội dung không phù hợp
  const originalNhanXet = nhanXet;

  // Loại bỏ HTML tags
  nhanXet = nhanXet.replace(/<[^>]*>/g, "");
  // Loại bỏ HTML entities
  nhanXet = nhanXet.replace(/&[a-z]+;/gi, "");
  // Loại bỏ các từ khóa không phù hợp (CHỦ ĐỀ, BÀI, v.v.)
  nhanXet = nhanXet.replace(/CHỦ ĐỀ\s*\d*:.*/gi, "");
  nhanXet = nhanXet.replace(/BÀI:.*/gi, "");
  nhanXet = nhanXet.replace(/ÔN TẬP.*/gi, "");
  // Trim lại sau khi clean
  nhanXet = nhanXet.trim();

  // Kiểm tra xem có HTML tags hoặc nội dung không phù hợp không
  const hasHtmlTags = /<[^>]+>/.test(originalNhanXet);
  const hasInvalidContent = /CHỦ ĐỀ|BÀI:|ÔN TẬP/i.test(originalNhanXet);

  // Nếu có HTML tags hoặc nội dung không phù hợp, hoặc sau khi clean không còn gì, thay bằng dấu chấm
  if (hasHtmlTags || hasInvalidContent || !nhanXet) {
    nhanXet = ".".repeat(50);
  } else {
    // Kiểm tra xem có chứa chữ cái không (nếu có thì không phải chỉ dấu chấm)
    const hasLetters = /[A-Za-zÀ-ỹ]/.test(nhanXet);
    if (hasLetters) {
      // Có chữ cái - có thể là nội dung không phù hợp, thay bằng dấu chấm
      nhanXet = ".".repeat(50);
    } else {
      // Chỉ có dấu chấm và khoảng trắng - giữ lại nhưng giới hạn độ dài
      nhanXet = nhanXet.length > 150 ? nhanXet.substring(0, 150) : nhanXet;
      // Đảm bảo có ít nhất một số dấu chấm
      if (!nhanXet || !/\./.test(nhanXet)) {
        nhanXet = ".".repeat(50);
      }
    }
  }

  const limitedNhanXet = nhanXet;

  return {
    objectives: {
      knowledge:
        parsed.objectives?.knowledge ||
        `Học sinh nắm được nội dung chính của ${input.lessonTitle}`,
      competencies: {
        general: Array.isArray(parsed.objectives?.competencies?.general)
          ? toArray(parsed.objectives.competencies.general)
          : [
              "Tự chủ và tự học",
              "Giao tiếp và hợp tác",
              "Giải quyết vấn đề và sáng tạo",
            ],
        specific: Array.isArray(parsed.objectives?.competencies?.specific)
          ? toArray(parsed.objectives.competencies.specific)
          : [`Năng lực đặc thù môn ${input.subject}`],
      },
      qualities: Array.isArray(parsed.objectives?.qualities)
        ? toArray(parsed.objectives.qualities)
        : ["Yêu nước", "Nhân ái", "Chăm chỉ", "Trung thực"],
    },
    equipment: {
      // Format: một dòng duy nhất cho mỗi phần (join array thành string)
      teacher: Array.isArray(parsed.equipment?.teacher)
        ? [toArray(parsed.equipment.teacher).join(", ")]
        : ["Sách giáo khoa, Giáo án điện tử, Máy chiếu"],
      student: Array.isArray(parsed.equipment?.student)
        ? [toArray(parsed.equipment.student).join(", ")]
        : ["Sách giáo khoa, Vở ghi chép, Bút, thước"],
    },
    activities: {
      activity1: {
        title:
          parsed.activities?.activity1?.title ||
          "Hoạt động 1: Mở đầu (Khởi động, Xác định vấn đề)",
        content:
          parsed.activities?.activity1?.content || "Nội dung hoạt động 1",
      },
      activity2: {
        title:
          parsed.activities?.activity2?.title ||
          "Hoạt động 2: Hình thành kiến thức mới",
        content:
          parsed.activities?.activity2?.content || "Nội dung hoạt động 2",
      },
      activity3: {
        title:
          parsed.activities?.activity3?.title ||
          "Hoạt động 3: Luyện tập (Thực hành, củng cố)",
        content:
          parsed.activities?.activity3?.content || "Nội dung hoạt động 3",
      },
      activity4: {
        title:
          parsed.activities?.activity4?.title ||
          "Hoạt động 4: Vận dụng/Tìm tòi mở rộng",
        content:
          parsed.activities?.activity4?.content || "Nội dung hoạt động 4",
      },
    },
    adjustment: {
      nhanXet: limitedNhanXet || "",
      huongDieuChinh: [],
    },
  };
};

/**
 * Mock service fallback (original implementation)
 */
const generateMockLessonPlan = async (
  input: LessonPlanInput
): Promise<ILessonPlan["content"]> => {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const { subject, grade, educationLevel, lessonTitle, duration } = input;

  // Generate content based on template 2345
  const content: ILessonPlan["content"] = {
    objectives: {
      knowledge: `Học sinh nắm được nội dung chính của ${lessonTitle}, hiểu được các khái niệm và kiến thức cơ bản liên quan đến bài học.`,
      competencies: {
        general: [
          "Tự chủ và tự học: Học sinh tự đọc, tự nghiên cứu tài liệu",
          "Giao tiếp và hợp tác: Thảo luận nhóm, trình bày ý kiến",
          "Giải quyết vấn đề và sáng tạo: Phân tích, đánh giá, đề xuất giải pháp",
        ],
        specific: [
          `Năng lực ngôn ngữ: Đọc hiểu, diễn đạt về ${subject}`,
          "Năng lực tìm kiếm: Thu thập thông tin từ nhiều nguồn",
          "Năng lực phát hiện: Nhận biết các vấn đề trong bài học",
        ],
      },
      qualities: [
        "Yêu nước: Tôn trọng và giữ gìn giá trị văn hóa",
        "Nhân ái: Quan tâm, chia sẻ với bạn bè",
        "Chăm chỉ: Tích cực tham gia các hoạt động học tập",
        "Trung thực: Thẳng thắn trong học tập và đánh giá",
      ],
    },
    equipment: {
      teacher: [
        "Sách giáo khoa",
        "Giáo án điện tử",
        "Máy chiếu/Màn hình",
        "Bảng phụ",
        "Tranh ảnh minh họa",
      ],
      student: [
        "Sách giáo khoa",
        "Vở ghi chép",
        "Bút, thước",
        "Dụng cụ học tập theo môn học",
      ],
    },
    activities: {
      activity1: {
        title: "Hoạt động 1: Mở đầu (Khởi động, Xác định vấn đề)",
        content: `**Thời gian:** 5-7 phút

**Mục tiêu:** Tạo hứng thú, kích thích tư duy học sinh

**Nội dung:**
- Giáo viên đặt câu hỏi gợi mở về chủ đề ${lessonTitle}
- Học sinh thảo luận nhóm nhỏ về những hiểu biết ban đầu
- Xác định nhiệm vụ học tập: Tìm hiểu về ${lessonTitle}
- Kết nối với kiến thức đã học trước đó

**Phương pháp:** Đàm thoại, thảo luận nhóm`,
      },
      activity2: {
        title: "Hoạt động 2: Hình thành kiến thức mới",
        content: `**Thời gian:** ${Math.floor(duration * 0.4)} phút

**Mục tiêu:** Học sinh nắm được kiến thức cốt lõi của bài học

**Nội dung:**
- Giáo viên trình bày nội dung chính của ${lessonTitle}
- Học sinh đọc sách giáo khoa, làm việc cá nhân và nhóm
- Phân tích, khám phá các khái niệm quan trọng
- Giáo viên giải thích, làm rõ các điểm khó hiểu
- Học sinh ghi chép, hệ thống hóa kiến thức

**Phương pháp:** Thuyết trình, đàm thoại, làm việc nhóm, phân tích`,
      },
      activity3: {
        title: "Hoạt động 3: Luyện tập (Thực hành, củng cố)",
        content: `**Thời gian:** ${Math.floor(duration * 0.3)} phút

**Mục tiêu:** Củng cố kiến thức, rèn luyện kỹ năng

**Nội dung:**
- Học sinh làm bài tập trong sách giáo khoa
- Thực hành các dạng bài tập từ cơ bản đến nâng cao
- Giáo viên quan sát, hỗ trợ học sinh gặp khó khăn
- Chữa bài tập, rút kinh nghiệm
- Hệ thống hóa kiến thức đã học

**Phương pháp:** Thực hành, luyện tập, đánh giá`,
      },
      activity4: {
        title: "Hoạt động 4: Vận dụng/Tìm tòi mở rộng",
        content: `**Thời gian:** ${Math.floor(duration * 0.2)} phút

**Mục tiêu:** Vận dụng kiến thức vào thực tế, mở rộng hiểu biết

**Nội dung:**
- Học sinh vận dụng kiến thức đã học vào tình huống thực tế
- Tìm hiểu thêm về các vấn đề liên quan đến ${lessonTitle}
- Thực hiện dự án nhỏ hoặc bài tập mở rộng
- Trình bày kết quả, chia sẻ với lớp
- Giáo viên tổng kết, đánh giá

**Phương pháp:** Dự án, thuyết trình, tự học`,
      },
    },
  };

  return content;
};
