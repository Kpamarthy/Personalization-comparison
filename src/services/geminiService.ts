import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTIONS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

import { PersonalizationType } from '../types';

export async function generateShoppingResponse(
  prompt: string,
  isPersonalized: boolean,
  vertical: string,
  selectedPersonalization: PersonalizationType[],
  onChunk: (text: string, isComplete: boolean, metadata?: { suggestions: string[], products: any[] }) => void,
  personalizationContext?: string,
  guardrails?: string,
  standardConfigs?: string,
  usePersonalizedSuggestions: boolean = true
) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = isPersonalized 
    ? SYSTEM_INSTRUCTIONS.PERSONALIZED(personalizationContext || "No specific data provided.", vertical, selectedPersonalization, guardrails)
    : SYSTEM_INSTRUCTIONS.NON_PERSONALIZED(vertical, standardConfigs);

  const suggestionInstruction = usePersonalizedSuggestions
    ? "- 'suggestions': an array of 2-3 short follow-up prompt strings. These MUST be deeply personalized based on the user's specific context (e.g., mentioning their kitchen remodel, Gold Member status, or zipcode 94089) and the current conversation flow."
    : "- 'suggestions': an array of 2-3 short, generic follow-up prompt strings related to the vertical but NOT using any personal context";

  const productInstruction = "- 'products': an array of 3 relevant product objects. MANDATORY: You MUST always include exactly 3 products that are highly relevant to the user's query or current project context. Each product must have 'id', 'name', 'price', 'image' (use https://picsum.photos/seed/[descriptive-keyword]/200/200 where [descriptive-keyword] is a specific, relevant word from the product name), 'rating' (1-5), 'reviews', and 'isEcoFriendly' (boolean).";

  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction + `\n\nIMPORTANT: You MUST return your response in two distinct parts separated by the marker '---METADATA---'.
        
Part 1: The markdown response text (use standard sentence case, NEVER all-caps. Use proper markdown newlines).
Part 2: A JSON block containing:
${suggestionInstruction}
${productInstruction}

Example Output:
This is the response text.
---METADATA---
{ "suggestions": [...], "products": [...] }`,
        temperature: 0.7,
      },
    });

    let fullText = "";
    let hasReachedMetadata = false;
    let metadataBuffer = "";

    for await (const chunk of responseStream) {
      const chunkText = chunk.text || "";
      
      if (!hasReachedMetadata) {
        if (chunkText.includes("---METADATA---")) {
          const parts = chunkText.split("---METADATA---");
          fullText += parts[0];
          hasReachedMetadata = true;
          metadataBuffer += parts[1] || "";
          onChunk(fullText, false);
        } else {
          fullText += chunkText;
          onChunk(fullText, false);
        }
      } else {
        metadataBuffer += chunkText;
      }
    }

    // Parse metadata at the end
    let metadata = { suggestions: [], products: [] };
    try {
      let cleanMetadata = metadataBuffer.trim();
      
      // Fallback: if metadataBuffer is empty, try to find JSON in fullText
      if (!cleanMetadata && fullText.includes("{")) {
        const lastBraceIndex = fullText.lastIndexOf("{");
        const potentialJson = fullText.substring(lastBraceIndex);
        if (potentialJson.includes("suggestions") || potentialJson.includes("products")) {
          cleanMetadata = potentialJson;
        }
      }

      cleanMetadata = cleanMetadata.replace(/^```json/, "").replace(/```$/, "").trim();
      metadata = JSON.parse(cleanMetadata || "{}");
    } catch (e) {
      console.error("Failed to parse metadata", e, metadataBuffer);
    }

    onChunk(fullText, true, metadata);
    return { text: fullText, ...metadata };
  } catch (error) {
    console.error("Error generating response:", error);
    onChunk("An error occurred while communicating with the assistant.", true);
    throw error;
  }
}

export async function extractConversationContext(
  messages: { role: string, content: string }[],
  existingContext: string
) {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `
    You are a context extraction assistant. 
    Analyze the provided messages from a user to a shopping assistant.
    Extract key personal details, preferences, and intent that could be useful for future personalization.
    
    CRITICAL: You MUST ONLY derive context from the USER's messages. Do NOT consider any responses or suggestions the agent has given.
    
    CRITICAL: Only extract NEW information that is NOT already present in the "Existing Context" provided below.
    If the information is already covered, do not include it.
    
    Existing Context:
    ${existingContext}
    
    Focus on:
    - User preferences (colors, materials, styles)
    - Ongoing projects or life events
    - Explicitly stated needs or constraints
    - Budget preferences if mentioned
    
    Return a concise bulleted list of the extracted NEW context. 
    If no new context is found, return "No additional context derived."
    Be very concise.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: JSON.stringify(messages.slice(-10)) }] }],
      config: {
        systemInstruction,
        temperature: 0.1,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error extracting context:", error);
    return null;
  }
}

export async function generateStarterPrompts(
  vertical: string,
  personalizationContext: string,
  guardrails: string
) {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `
    You are a shopping assistant prompt generator.
    Based on the user's personalization context and the selected vertical (${vertical}), generate 3 short, engaging starter prompts that the user might want to ask.
    
    CRITICAL: You MUST prioritize information from "Conversation History" and "Order History" if they are present in the context.
    For example, if the history mentions a kitchen remodel, suggest prompts about specific materials or appliances mentioned.
    
    CRITICAL: Each prompt MUST be very short, strictly LESS THAN 5 WORDS.
    
    ${guardrails ? `ABSOLUTE REQUIREMENT: You MUST strictly follow these guardrails when generating prompts. If a prompt violates these, discard it and generate a new one:
    ${guardrails}
    
    Ensure the prompts reflect the specific focus or constraints defined in the guardrails above.` : ''}
    
    Return ONLY a JSON object with a 'prompts' key containing an array of 3 strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: `Vertical: ${vertical}\nContext: ${personalizationContext}` }] }],
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["prompts"]
        }
      },
    });
    const result = JSON.parse(response.text || "{}");
    return result.prompts || [];
  } catch (error) {
    console.error("Error generating starter prompts:", error);
    return [];
  }
}
