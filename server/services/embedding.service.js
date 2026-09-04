const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');
const SemanticCache = require('../models/semanticCache.model');

// Initialize Gemini for embeddings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Track whether embedding API is available (checked lazily on first call)
let embeddingAvailable = null; // null = untested, true/false = tested

/**
 * Normalizes text for hashing: lowercases, strips excess whitespace/punctuation,
 * sorts words alphabetically. This produces a consistent hash even when the
 * same job description has minor formatting differences.
 */
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')   // Replace punctuation with spaces
    .replace(/\s+/g, ' ')       // Collapse whitespace
    .trim()
    .split(' ')
    .sort()                      // Sort words to handle reordering
    .join(' ');
};

/**
 * Generates a deterministic hash of normalized text.
 * Used as fallback when embedding API is unavailable.
 */
const hashNormalizedText = (text) => {
  const normalized = normalizeText(text);
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

/**
 * Attempts to generate a 768-dimensional embedding vector for the given text
 * using Google's text-embedding-004 model.
 * Falls back to null if the embedding API is unavailable for this API key.
 */
const generateEmbedding = async (text) => {
  // Skip if we already know embeddings aren't available
  if (embeddingAvailable === false) {
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    embeddingAvailable = true;
    return result.embedding.values;
  } catch (error) {
    if (embeddingAvailable === null) {
      // First failure — mark as unavailable and log once
      embeddingAvailable = false;
      console.warn('⚠️ Embedding API unavailable — falling back to normalized text hashing for JD similarity.');
      console.warn('   (This is fine for development. For production, ensure your API key supports embedding models.)');
    }
    return null;
  }
};

/**
 * Generates a SHA-256 hash of the resume text for exact-match lookups.
 * This ensures no cross-candidate cache collisions.
 */
const hashResumeText = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Computes cosine similarity between two vectors.
 * Used as application-level fallback when MongoDB Atlas Vector Search is unavailable.
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
};

/**
 * Finds a cached evaluation matching the exact resume hash
 * AND a matching job description (either via semantic embedding or normalized hash).
 *
 * Strategy:
 * 1. If embeddings are available: cosine similarity on JD vectors
 * 2. If embeddings are unavailable: exact match on normalized JD hash
 */
const findCachedEvaluation = async (resumeHash, jdEmbedding, jdHash, threshold = 0.98) => {
  try {
    // Strategy A: Embedding-based search (when embeddings are available)
    if (jdEmbedding) {
      try {
        // Try Atlas $vectorSearch first
        const results = await SemanticCache.aggregate([
          {
            $vectorSearch: {
              index: 'jd_embedding_index',
              path: 'jobDescriptionEmbedding',
              queryVector: jdEmbedding,
              numCandidates: 20,
              limit: 5,
              filter: { resumeHash: resumeHash },
            },
          },
          { $addFields: { searchScore: { $meta: 'vectorSearchScore' } } },
          { $match: { searchScore: { $gte: threshold } } },
          { $limit: 1 },
        ]);

        if (results.length > 0) {
          console.log(`✅ Atlas Vector Search cache hit (score: ${results[0].searchScore.toFixed(4)})`);
          return { result: results[0].result, similarity: results[0].searchScore };
        }
      } catch (atlasError) {
        // Atlas not available — application-level cosine search
        const candidates = await SemanticCache.find({ resumeHash }).lean();
        for (const candidate of candidates) {
          if (candidate.jobDescriptionEmbedding && candidate.jobDescriptionEmbedding.length > 0) {
            const similarity = cosineSimilarity(jdEmbedding, candidate.jobDescriptionEmbedding);
            if (similarity >= threshold) {
              console.log(`✅ Application-level cache hit (similarity: ${similarity.toFixed(4)})`);
              return { result: candidate.result, similarity };
            }
          }
        }
      }
    }

    // Strategy B: Normalized hash match (fallback when no embeddings)
    if (jdHash) {
      const match = await SemanticCache.findOne({ resumeHash, jdHash }).lean();
      if (match) {
        console.log('✅ Cache hit via normalized JD hash (exact text match)');
        return { result: match.result, similarity: 1.0 };
      }
    }

    return null; // No cache hit
  } catch (error) {
    console.error('Cache lookup error:', error.message);
    return null; // Fail open
  }
};

/**
 * Stores an evaluation result in the semantic cache.
 */
const storeCachedEvaluation = async (resumeHash, jdEmbedding, jdHash, result, metadata = {}) => {
  try {
    await SemanticCache.create({
      resumeHash,
      jobDescriptionEmbedding: jdEmbedding || [],
      jdHash: jdHash || '',
      jobTitle: metadata.jobTitle || '',
      companyName: metadata.companyName || '',
      result,
    });
    console.log('✅ Evaluation stored in semantic cache.');
  } catch (error) {
    console.error('Cache store error:', error.message);
  }
};

module.exports = {
  generateEmbedding,
  hashResumeText,
  hashNormalizedText,
  cosineSimilarity,
  findCachedEvaluation,
  storeCachedEvaluation,
};
