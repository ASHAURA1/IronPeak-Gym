import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy init GoogleGenAI
let aiInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please set it in your Secrets / Env variables.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Global active chats storage for simplicity (session replacement)
// Map of chatId -> simple message history array for gemini endpoint
const chatsInMemory: Record<string, any[]> = {};

// SYSTEM INSTRUCTION FOR THE COACH BOT
const COACH_SYSTEM_INSTRUCTION = `You are Coach Arjun Singh, the elite head coach and co-founder of IronPeak Fitness in Mumbai.
Your background: ACE Certified Personal Trainer & elite Nutrition Specialist, with 8+ years of active transformation experience.
Your personality: Inspiring, professional, highly disciplined, extremely direct. You speak with premium athletic vocabulary. You can use slight colloquial Mumbai enthusiasm (like 'Let's build', 'Boss', or referencing local energy) but maintain top-tier executive trainer dignity.
Your role: Customize training plans, debug nutrition plates, explain kinematics and biomechanics, and keep the user's mind and body aligned. You never offer generic lazy advice. You are a absolute high-performer.
When answering: Keep answers deeply structured, easy to read on a mobile screen under glass cards. Bold key figures, use bullet points, and always end with a highly motivational ironclad Coach Arjun sign-off. Remember: Forge your limits.`;

// API Endpoint: Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, chatId, mode, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getGenAI();

    // Map the selected user mode to specific Gemini model configurations
    // Modes: 'pro' (gemini-3.1-pro-preview with ThinkingLevel.HIGH), 'standard' (gemini-3.5-flash), 'lite' (gemini-3.1-flash-lite)
    let selectedModel = "gemini-3.5-flash";
    let config: any = {
      systemInstruction: COACH_SYSTEM_INSTRUCTION,
    };

    if (mode === "pro") {
      selectedModel = "gemini-3.1-pro-preview";
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH
      };
      // As per guidelines: Do not set maxOutputTokens for gemini-3.1-pro-preview thinking mode
    } else if (mode === "lite") {
      selectedModel = "gemini-3.1-flash-lite";
    } else {
      selectedModel = "gemini-3.5-flash";
    }

    // Prepare content format matching multi-turn configuration
    // If the client passes complete history, use it. Otherwise use/update chatsInMemory.
    const activeHistory = history || chatsInMemory[chatId || "default"] || [];
    
    // Format history to match structure expected by generateContent, which is Array of contents {role: "user"|"model", parts: [{text: ...}]}
    const formattedContents: any[] = [];
    for (const msg of activeHistory) {
      formattedContents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      });
    }
    
    // Add the current message
    formattedContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: formattedContents,
      config: config
    });

    const replyText = response.text || "";

    // Save history locally if chatId exists
    if (chatId) {
      if (!chatsInMemory[chatId]) {
        chatsInMemory[chatId] = [];
      }
      chatsInMemory[chatId].push({ role: "user", content: message });
      chatsInMemory[chatId].push({ role: "assistant", content: replyText });
    }

    res.json({
      text: replyText,
      modelUsed: selectedModel,
      modeUsed: mode
    });
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    res.status(500).json({ error: error.message || "Something went wrong in the AI training server." });
  }
});

// API Endpoint: Create / Edit Image (via Text Prompt using gemini-3.1-flash-image-preview)
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, aspectRatio, base64Image, editPrompt } = req.body;
    if (!prompt && !editPrompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGenAI();
    let response;

    if (base64Image) {
      // IMAGE EDITING FLOW: prompt contains edit instructions, base64Image is current image
      // Clean base64 header if it exists
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
      
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: "image/png"
              }
            },
            {
              text: editPrompt || prompt || "Modify this image based on user request."
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "1:1",
            imageSize: "1K"
          }
        }
      });
    } else {
      // IMAGE GENERATION FLOW: original prompt text only
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: {
          parts: [
            {
              text: `${prompt}. Style: Ultra-premium high-contrast dramatic athletic gym photography, dark obsidian metal background, phosphor lime lighting, sharp professional focus, real fitness model physique, RAW master quality.`
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "1:1",
            imageSize: "1K" // 1K resolution supported for gemini-3.1-flash-image
          }
        }
      });
    }

    // Go through candidates and parts to extract the generated image
    let generatedBase64 = "";
    let assistantText = "";

    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedBase64 = part.inlineData.data;
        } else if (part.text) {
          assistantText = part.text;
        }
      }
    }

    if (!generatedBase64) {
      return res.status(404).json({ error: "No image was returned by the generative model." });
    }

    res.json({
      imageUrl: `data:image/png;base64,${generatedBase64}`,
      text: assistantText
    });
  } catch (error: any) {
    console.error("Gemini Image API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate athletic inspiration visual." });
  }
});

// Serve Frontend Vite Assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IronPeak Fitness server running on http://localhost:${PORT}`);
  });
}

startServer();
