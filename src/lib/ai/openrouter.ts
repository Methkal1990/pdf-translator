import { createOpenAI } from '@ai-sdk/openai';

export function getModel() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  // Debug: log first/last few chars of API key to verify it's loaded
  console.log(`[OpenRouter] API Key loaded: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);

  const modelId = process.env.AI_MODEL_ID || 'anthropic/claude-3.5-sonnet';
  console.log(`[OpenRouter] Using model: ${modelId}`);

  // Use OpenAI-compatible client pointing to OpenRouter
  const openrouter = createOpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  });

  return openrouter.chat(modelId);
}
