import { GoogleGenerativeAI } from "@google/generative-ai"

// Validate environment variable
if (!process.env.GOOGLE_AI_KEY) {
    throw new Error('GOOGLE_AI_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);

// Chat model for @ai - normal conversation, no files
const chatModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
    },
    systemInstruction: `You are a helpful AI assistant in a developer chat room. Answer questions and help users with development topics. 

CRITICAL RULES - NEVER VIOLATE THESE:
- NEVER create files or code structures
- NEVER include "fileTree" in your response
- ONLY return {"text": "your response here"} format
- Respond as pure text like a normal person would
- Be helpful, concise, and friendly

FORBIDDEN RESPONSES:
- Do NOT return fileTree, fileTree, or any file-related fields
- Do NOT create any files or code structures
- Do NOT include buildCommand or startCommand

CORRECT EXAMPLES:
User: "tell me total number of iits in india"
Response: {"text": "As of September 2025, there are 23 Indian Institutes of Technology (IITs) in India."}

User: "list all iits with names"
Response: {"text": "Here are the 23 IITs in India: 1. IIT Kharagpur, 2. IIT Bombay, 3. IIT Madras, 4. IIT Delhi, 5. IIT Kanpur, 6. IIT Guwahati, 7. IIT Roorkee, 8. IIT Bhubaneswar, 9. IIT Gandhinagar, 10. IIT Hyderabad, 11. IIT Jodhpur, 12. IIT Patna, 13. IIT Ropar, 14. IIT Indore, 15. IIT Mandi, 16. IIT Varanasi (BHU), 17. IIT Palakkad, 18. IIT Tirupati, 19. IIT Jammu, 20. IIT Dhanbad, 21. IIT Bhilai, 22. IIT Goa, 23. IIT Dharwad."}

REMEMBER: ONLY {"text": "response"} - NO FILES!`
});

// Code generation model for @ai_code - single file only
const codeModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
    },
    systemInstruction: `You are an expert developer. When asked to create code, create ONLY A SINGLE FILE as requested.

CRITICAL RULES:
- Create ONLY ONE file per request
- Do NOT create multiple files (no package.json, no additional files)
- Focus on the specific file the user asks for
- Always return JSON format with "text" and "fileTree" fields

Example:
User: "create a app.js and inside it create a simple express server"
Response: {
  "text": "Created app.js with a simple Express server",
  "fileTree": {
    "app.js": {
      "file": {
        "contents": "const express = require('express');\\nconst app = express();\\n\\n// Define a simple route\\napp.get('/', (req, res) => {\\n  res.send('Hello, Express Server!');\\n});\\n\\n// Start the server\\nconst PORT = 3000;\\napp.listen(PORT, () => {\\n  console.log('Server is running on http://localhost:' + PORT);\\n});"
      }
    }
  }
}

IMPORTANT: 
- Only create the file the user specifically asks for
- Do NOT create package.json or other supporting files
- Keep it simple and focused on the single request`
});

// Chat mode for @ai - normal conversation
export const generateChatResult = async (prompt) => {
    try {
        const safePrompt = (prompt ?? '').trim().length > 0 ? prompt : 'Greet the team briefly and ask how you can help.';
        const result = await chatModel.generateContent(safePrompt);
        return result.response.text();
    } catch (error) {
        console.error('Error in generateChatResult:', error);
        throw new Error(`AI chat generation failed: ${error.message}`);
    }
}

// Code generation mode for @ai_code - single file only
export const generateCodeResult = async (prompt) => {
    try {
        const result = await codeModel.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Error in generateCodeResult:', error);
        throw new Error(`AI code generation failed: ${error.message}`);
    }
}

// Legacy function for backward compatibility (uses code model)
export const generateResult = async (prompt) => {
    try {
        const result = await codeModel.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Error in generateResult:', error);
        throw new Error(`AI generation failed: ${error.message}`);
    }
}