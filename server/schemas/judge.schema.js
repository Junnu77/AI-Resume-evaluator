const { z } = require('zod');
const { SchemaType } = require('@google/generative-ai');

/**
 * Zod schema validating the LLM judge output structure.
 * Used for runtime validation after Gemini responds.
 */
const JudgeOutputSchema = z.object({
  faithfulness: z.object({
    score: z.boolean(),
    reasoning: z.string(),
  }),
  relevance: z.object({
    score: z.boolean(),
    reasoning: z.string(),
  }),
  overallTrust: z.number().min(0).max(100),
});

/**
 * Gemini responseSchema using the SDK's native SchemaType enum.
 */
const geminiJudgeSchema = {
  type: SchemaType.OBJECT,
  properties: {
    faithfulness: {
      type: SchemaType.OBJECT,
      properties: {
        score: { type: SchemaType.BOOLEAN, description: 'true if all claims are supported by the source resume, false if any are hallucinated' },
        reasoning: { type: SchemaType.STRING, description: 'Specific explanation citing examples of hallucinations or confirming faithfulness' },
      },
      required: ['score', 'reasoning'],
    },
    relevance: {
      type: SchemaType.OBJECT,
      properties: {
        score: { type: SchemaType.BOOLEAN, description: 'true if the analysis is relevant to the target role, false if off-topic' },
        reasoning: { type: SchemaType.STRING, description: 'Specific explanation of relevance or irrelevance to the job role' },
      },
      required: ['score', 'reasoning'],
    },
    overallTrust: {
      type: SchemaType.NUMBER,
      description: 'Overall trust score from 0-100. Both pass: 80-100, one fails: 30-60, both fail: 0-30',
    },
  },
  required: ['faithfulness', 'relevance', 'overallTrust'],
};

module.exports = {
  JudgeOutputSchema,
  geminiJudgeSchema,
};
