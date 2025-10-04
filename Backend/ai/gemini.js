"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlantCareTips = getPlantCareTips;
exports.generateNotificationContent = generateNotificationContent;
exports.analyzePlantHealth = analyzePlantHealth;
const dotenv_1 = __importDefault(require("dotenv"));
const generative_ai_1 = require("@google/generative-ai");
dotenv_1.default.config();
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
}
const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
async function getPlantCareTips(plantName, problem) {
    const prompt = `Give me detailed care tips for a ${plantName} showing signs of ${problem}. 
Include causes, solutions, and prevention tips.`;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
    catch (err) {
        console.error("Gemini API error:", err);
        return "Sorry, I couldn't generate care tips at the moment.";
    }
}
async function generateNotificationContent(type, context) {
    let prompt = '';
    switch (type) {
        case 'reminder':
            prompt = `Generate a friendly plant care reminder message for ${context.plantName}. The task is ${context.task}. Keep it encouraging and under 100 characters.`;
            break;
        case 'alert':
            prompt = `Generate an urgent but helpful alert message about ${context.issue} for ${context.plantName}. Include a quick action tip. Keep it under 120 characters.`;
            break;
        case 'tip':
            prompt = `Generate a helpful plant care tip for ${context.plantName} owners. Make it seasonal and practical. Keep it under 150 characters.`;
            break;
        default:
            return 'Plant care notification';
    }
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
    catch (err) {
        console.error("Gemini API error:", err);
        return `Plant care ${type}`;
    }
}
async function analyzePlantHealth(plantName, symptoms, environment) {
    const prompt = `Analyze the health of a ${plantName} with these symptoms: ${symptoms}. 
Environment details: ${JSON.stringify(environment)}. 
Provide a diagnosis, severity level (low/medium/high), and 3-5 specific recommendations.
Format as JSON with keys: diagnosis, severity, recommendations (array).`;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        try {
            const analysis = JSON.parse(text);
            return {
                diagnosis: analysis.diagnosis || 'Unable to determine diagnosis',
                severity: ['low', 'medium', 'high'].includes(analysis.severity) ? analysis.severity : 'medium',
                recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : ['Monitor plant closely']
            };
        }
        catch (parseError) {
            return {
                diagnosis: text.slice(0, 200),
                severity: 'medium',
                recommendations: ['Monitor plant health', 'Ensure proper watering', 'Check light conditions']
            };
        }
    }
    catch (err) {
        console.error("Gemini API error:", err);
        return {
            diagnosis: 'Unable to analyze plant health at this time',
            severity: 'medium',
            recommendations: ['Monitor plant closely', 'Ensure basic care needs are met']
        };
    }
}
//# sourceMappingURL=gemini.js.map