import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    console.log('Testing gemini-flash-latest...');
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    await model.generateContent('Hi');
    console.log('SUCCESS: gemini-flash-latest works!');
  } catch (e) {
    console.error('ERROR gemini-flash-latest:', e.message);
  }
}

checkModels();
