const mongoose = require('mongoose');

const semanticCacheSchema = new mongoose.Schema({
  resumeHash: {
    type: String,
    required: true,
    index: true,
  },
  jobDescriptionEmbedding: {
    type: [Number],
    default: [],
  },
  jdHash: {
    type: String,
    index: true,
  },
  jobTitle: {
    type: String,
  },
  companyName: {
    type: String,
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index to automatically expire cache documents after 24 hours
semanticCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('SemanticCache', semanticCacheSchema);
