import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, UserProfile } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

// This is a simplified representation. A real chat history would be more complex.
const buildHistoryForAPI = (messages: Message[]) => {
  return messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));
};

const getChatResponse = async (messages: Message[], userProfile?: UserProfile | null): Promise<GenerateContentResponse> => {
  const history = buildHistoryForAPI(messages.slice(0, -1));
  const latestMessage = messages[messages.length - 1];

  let systemInstruction = "You are ByteBuddy, a helpful and friendly AI assistant focused on health and wellness. You must provide safe, general advice. Crucially, always include a reminder for the user to consult a healthcare professional for personal medical advice. Do not provide information that could be construed as a diagnosis or treatment plan.";

  if (userProfile && Object.values(userProfile).some(val => val)) {
    systemInstruction += "\n\nHere is some information about the user you are talking to. Use this to personalize your responses. Do not mention that you have this data unless it's directly relevant to the user's question. Be subtle about how you use it.\n";
    systemInstruction += `User Profile:\n`;
    if (userProfile.age) systemInstruction += `- Age: ${userProfile.age}\n`;
    if (userProfile.gender) systemInstruction += `- Gender: ${userProfile.gender}\n`;
    if (userProfile.height) systemInstruction += `- Height: ${userProfile.height} ${userProfile.units === 'Metric' ? 'cm' : 'in'}\n`;
    if (userProfile.weight) systemInstruction += `- Weight: ${userProfile.weight} ${userProfile.units === 'Metric' ? 'kg' : 'lbs'}\n`;
    if (userProfile.goal) systemInstruction += `- Primary Goal: ${userProfile.goal}\n`;
    if (userProfile.activityLevel) systemInstruction += `- Activity Level: ${userProfile.activityLevel}\n`;
    if (userProfile.restrictions) systemInstruction += `- Dietary Restrictions: ${userProfile.restrictions}\n`;
  }


  const chat = ai.chats.create({
    model,
    history,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
    },
  });

  const response = await chat.sendMessage({ message: latestMessage.content });
  return response;
};

const generateTitle = async (firstMessage: string): Promise<string> => {
    try {
        const result = await ai.models.generateContent({
            model,
            contents: `Generate a short, concise title (max 5 words) for this chat conversation. Return only the title text, nothing else. Conversation starts with: "${firstMessage}"`,
        });
        return result.text.trim().replace(/"/g, '');
    } catch (error) {
        console.error('Error generating title:', error);
        return "New Chat";
    }
};

const generateDietaryPlan = async (prompt: string): Promise<GenerateContentResponse> => {
  const fullPrompt = `
    Based on the following user profile, generate a complete and personalized 7-day meal plan.
    
    ${prompt}

    **Instructions for Output:**
    1.  **Disclaimer First:** The entire response MUST begin with the following disclaimer, exactly as written:
        "[Disclaimer: This is an AI-generated plan and is not a substitute for professional medical advice. Consult with a healthcare provider before making any significant dietary changes.]"
    2.  **Format:** The entire response must be in Markdown format. Use headings for each day.
    3.  **Meal Plan:** Provide a detailed 7-day meal plan (Day 1 to Day 7) with breakfast, lunch, and dinner suggestions.
    4.  **Water Intake Section:** After the 7-day plan, you MUST include a new section titled "### Daily Water Intake Recommendation".
    5.  **Water Intake Calculation:** In this section, calculate the user's recommended daily water intake based on their profile (especially weight and activity level).
    6.  **Water Intake Format:** You MUST present this recommendation in three specific formats on separate lines:
        - In litres (e.g., **Litres:** 2.5 L)
        - In millilitres (e.g., **Millilitres:** 2500 ml)
        - In cups (e.g., **Cups:** ~10 cups). You must assume 1 cup is 240ml for your calculation.
  `;
    
  const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
  });
  return response;
};

const analyzeMeal = async (mealDescription: string): Promise<GenerateContentResponse> => {
    const prompt = `
        Analyze the following meal description and provide a nutritional breakdown.
        The response should be in Markdown format.
        Start with an estimated calorie count. Then, provide a general overview of the macronutrients (protein, carbs, fat).
        Finally, offer some healthier alternatives or suggestions for improvement if applicable.
        Include a disclaimer that this is an estimation and a professional nutritionist should be consulted for accurate information.

        Meal: "${mealDescription}"
    `;
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });
    return response;
};

const estimateCalories = async (description: string, amount: string): Promise<number> => {
    try {
        const prompt = `Estimate the total calories for the following meal. Respond with only a single number, without any additional text, labels, or units. Meal: "${amount} of ${description}"`;
        const result = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        const calorieText = result.text.trim();
        const calories = parseInt(calorieText, 10);
        return isNaN(calories) ? 0 : calories;
    } catch (error) {
        console.error('Error estimating calories:', error);
        return 0; // Return a default value on error
    }
};


export const geminiService = {
  getChatResponse,
  generateTitle,
  generateDietaryPlan,
  analyzeMeal,
  estimateCalories,
};
