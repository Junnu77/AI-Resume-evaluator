const { z } = require('zod');
const { SchemaType } = require('@google/generative-ai');

/**
 * Zod schema validating the LLM evaluation output structure.
 * Used for runtime validation after Gemini responds.
 */
const EvaluationOutputSchema = z.object({
  overallScore: z.number().min(0).max(100),
  atsScore: z.number().min(0).max(100),
  keywordMatch: z.number().min(0).max(100),
  missingSkills: z.array(z.string()),
  improvements: z.array(z.string()),
  sectionFeedback: z.object({
    summary: z.string(),
    experience: z.string(),
    skills: z.string(),
    projects: z.string(),
    formatting: z.string(),
  }),
});

/**
 * Gemini responseSchema using the SDK's native SchemaType enum.
 * This is the ONLY format Gemini reliably enforces for structured output.
 * We define it explicitly instead of deriving from Zod to guarantee compatibility.
 */
const geminiResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    overallScore: {
      type: SchemaType.NUMBER,
      description: 'Overall resume match score from 0 to 100',
    },
    atsScore: {
      type: SchemaType.NUMBER,
      description: 'ATS compatibility score from 0 to 100',
    },
    keywordMatch: {
      type: SchemaType.NUMBER,
      description: 'Keyword match percentage from 0 to 100',
    },
    missingSkills: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'List of critical skills missing from the resume',
    },
    improvements: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'List of suggested improvements for the resume',
    },
    sectionFeedback: {
      type: SchemaType.OBJECT,
      properties: {
        summary: { type: SchemaType.STRING, description: 'Feedback on the resume summary/objective section' },
        experience: { type: SchemaType.STRING, description: 'Feedback on the work experience section' },
        skills: { type: SchemaType.STRING, description: 'Feedback on the skills section' },
        projects: { type: SchemaType.STRING, description: 'Feedback on the projects section' },
        formatting: { type: SchemaType.STRING, description: 'Feedback on the resume formatting and layout' },
      },
      required: ['summary', 'experience', 'skills', 'projects', 'formatting'],
      description: 'Section-by-section feedback on the resume',
    },
  },
  required: ['overallScore', 'atsScore', 'keywordMatch', 'missingSkills', 'improvements', 'sectionFeedback'],
};

module.exports = {
  EvaluationOutputSchema,
  geminiResponseSchema,
};
