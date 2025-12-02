/**
 * Task Type Detection Engine - Production Implementation
 *
 * @module task-type-detector
 * @description Production implementation of task type detection algorithm (TASK-TYPE-001)
 * Detects task types based on keyword matching, pattern matching, and context analysis.
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-018
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cached pattern library
let patternLibrary = null;

/**
 * Load pattern library from JSON file
 *
 * @returns {Object} Pattern library object
 * @private
 */
function loadPatternLibrary() {
  if (!patternLibrary) {
    const patternPath = join(__dirname, '../algorithms/task-type-patterns.json');
    const content = readFileSync(patternPath, 'utf-8');
    patternLibrary = JSON.parse(content);
  }
  return patternLibrary;
}

/**
 * Analyze task types for an array of tasks
 *
 * @param {Object[]} tasks - Array of task objects with id, title, description, acceptance_criteria
 * @param {Object} [options={}] - Detection options
 * @param {number} [options.confidenceThreshold=0.4] - Minimum confidence for primary type
 * @param {number} [options.multiTypeThreshold=0.3] - Minimum confidence for secondary types
 * @param {boolean} [options.enableFallback=true] - Enable fallback logic for undetected types
 * @returns {Object} Analysis result with classifications and summary
 *
 * @example
 * const analysis = analyzeTaskTypes(tasks, {
 *   confidenceThreshold: 0.4,
 *   multiTypeThreshold: 0.3
 * });
 * // => { classifications: {...}, summary: {...} }
 */
export function analyzeTaskTypes(tasks, options = {}) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return {
      classifications: {},
      summary: {
        totalTasks: 0,
        uniqueTypes: 0,
        typeDistribution: {},
        avgConfidence: 0,
        avgAmbiguity: 0,
        mostCommonType: 'general'
      }
    };
  }

  const patterns = loadPatternLibrary();
  const results = {};

  tasks.forEach(task => {
    if (task && task.id) {
      results[task.id] = detectTaskType(task, patterns, options);
    }
  });

  // Generate summary statistics
  const summary = generateTypeSummary(results);

  return {
    classifications: results,
    summary
  };
}

/**
 * Detect task type from task description and metadata
 *
 * @param {Object} task - Task object with title, description, acceptance_criteria
 * @param {Object} patternLibrary - Loaded detection patterns
 * @param {Object} [options={}] - Detection options
 * @returns {Object} Classification result with primary type, secondary types, confidence
 *
 * @example
 * const classification = detectTaskType(task, patterns);
 * // => { primaryType: 'backend', secondaryTypes: ['testing'], confidence: 0.85, ... }
 */
export function detectTaskType(task, patternLibrary, options = {}) {
  const {
    confidenceThreshold = 0.4,
    multiTypeThreshold = 0.3,
    enableFallback = true
  } = options;

  // Normalize and tokenize task text
  const taskText = normalizeTaskText(task);
  const tokens = tokenize(taskText);

  // Calculate scores for all task types
  const scores = {};
  Object.keys(patternLibrary.types).forEach(type => {
    scores[type] = calculateTypeScore(tokens, taskText, patternLibrary.types[type]);
  });

  // Find primary type (highest score above threshold)
  const sortedTypes = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);

  const primaryType = sortedTypes[0][1] >= confidenceThreshold
    ? sortedTypes[0][0]
    : null;

  // Find secondary types (additional types above multiTypeThreshold)
  const secondaryTypes = sortedTypes
    .slice(1)
    .filter(([, score]) => score >= multiTypeThreshold)
    .map(([type]) => type);

  // Apply fallback if no type detected
  if (!primaryType && enableFallback) {
    return applyFallbackRules(task, scores);
  }

  return {
    primaryType: primaryType || 'general',
    secondaryTypes,
    confidence: primaryType ? scores[primaryType] : 0,
    allScores: scores,
    metadata: {
      matchedPatterns: primaryType ? extractMatchedPatterns(taskText, patternLibrary, primaryType) : [],
      ambiguityLevel: calculateAmbiguity(scores)
    }
  };
}

/**
 * Calculate confidence score for a specific task type
 *
 * @param {string[]} tokens - Normalized word tokens from task
 * @param {string} text - Full normalized text
 * @param {Object} typeConfig - Configuration for this task type
 * @returns {number} Confidence score (0.0 - 1.0)
 * @private
 */
function calculateTypeScore(tokens, text, typeConfig) {
  let score = 0;

  // 1. Keyword matching (50% weight)
  const keywordScore = matchKeywords(tokens, typeConfig.keywords || []);
  score += keywordScore.score * 0.5;

  // 2. Pattern matching (30% weight)
  const patternScore = matchPatterns(text, typeConfig.patterns || []);
  score += patternScore.score * 0.3;

  // 3. Context word presence (20% weight)
  const contextScore = matchContextWords(tokens, typeConfig.context_words || []);
  score += contextScore.score * 0.2;

  // Apply exclusion patterns (reduce score if present)
  const exclusionPenalty = applyExclusionPatterns(text, typeConfig.exclusions || []);
  score = Math.max(0, score - exclusionPenalty);

  // Apply type weight multiplier
  score *= typeConfig.weight || 1.0;

  // Normalize to [0, 1] range
  return Math.min(1.0, score);
}

/**
 * Match keywords in token array
 *
 * @param {string[]} tokens - Token array
 * @param {string[]} keywords - Keyword array
 * @returns {Object} Match result with count and score
 * @private
 */
function matchKeywords(tokens, keywords) {
  if (keywords.length === 0) {
    return { count: 0, score: 0 };
  }

  const normalizedKeywords = keywords.map(k => k.toLowerCase());
  let matchCount = 0;
  let totalWeight = 0;

  tokens.forEach(token => {
    if (normalizedKeywords.includes(token)) {
      matchCount++;
      // Longer keywords get higher weight (more specific)
      totalWeight += Math.log2(token.length + 1);
    }
  });

  // Score based on match density and specificity
  const score = matchCount > 0
    ? Math.min(1.0, (totalWeight / Math.max(1, tokens.length)) * (matchCount / keywords.length))
    : 0;

  return {
    count: matchCount,
    score
  };
}

/**
 * Match regex patterns in text
 *
 * @param {string} text - Full text string
 * @param {string[]} patterns - Array of regex pattern strings
 * @returns {Object} Match result with count and score
 * @private
 */
function matchPatterns(text, patterns) {
  if (patterns.length === 0) {
    return { count: 0, score: 0, patterns: [] };
  }

  let matchCount = 0;
  const matchedPatterns = [];

  patterns.forEach(patternStr => {
    try {
      // Convert pattern string to RegExp
      const match = patternStr.match(/^\/(.+)\/([gimuy]*)$/);
      if (!match) return;

      const pattern = new RegExp(match[1], match[2]);
      if (pattern.test(text)) {
        matchCount++;
        matchedPatterns.push(patternStr);
      }
    } catch (err) {
      // Ignore invalid regex patterns
    }
  });

  // Patterns are high-confidence signals
  const score = matchCount > 0
    ? Math.min(1.0, matchCount / patterns.length + 0.2) // bonus for any match
    : 0;

  return {
    count: matchCount,
    score,
    patterns: matchedPatterns
  };
}

/**
 * Match context words in token array
 *
 * @param {string[]} tokens - Token array
 * @param {string[]} contextWords - Context word array
 * @returns {Object} Match result with count and score
 * @private
 */
function matchContextWords(tokens, contextWords) {
  if (!contextWords || contextWords.length === 0) {
    return { count: 0, score: 0 };
  }

  const normalizedContext = contextWords.map(w => w.toLowerCase());
  let matchCount = 0;

  tokens.forEach(token => {
    if (normalizedContext.includes(token)) {
      matchCount++;
    }
  });

  // Context words provide supporting evidence
  const score = matchCount / Math.max(1, contextWords.length);

  return {
    count: matchCount,
    score: Math.min(1.0, score)
  };
}

/**
 * Apply exclusion pattern penalties
 *
 * @param {string} text - Full text string
 * @param {string[]} exclusions - Exclusion patterns
 * @returns {number} Penalty score
 * @private
 */
function applyExclusionPatterns(text, exclusions) {
  if (!exclusions || exclusions.length === 0) return 0;

  let penalty = 0;

  exclusions.forEach(exclusion => {
    if (text.includes(exclusion.toLowerCase())) {
      penalty += 0.2; // reduce score by 20% per exclusion match
    }
  });

  return Math.min(0.5, penalty); // cap at 50% penalty
}

/**
 * Extract matched patterns for debugging
 *
 * @param {string} text - Full text string
 * @param {Object} patternLibrary - Pattern library
 * @param {string} primaryType - Primary type detected
 * @returns {string[]} Array of matched pattern descriptions
 * @private
 */
function extractMatchedPatterns(text, patternLibrary, primaryType) {
  if (!primaryType || !patternLibrary.types[primaryType]) {
    return [];
  }

  const typeConfig = patternLibrary.types[primaryType];
  const matched = [];

  (typeConfig.patterns || []).forEach(patternStr => {
    try {
      const match = patternStr.match(/^\/(.+)\/([gimuy]*)$/);
      if (!match) return;

      const pattern = new RegExp(match[1], match[2]);
      if (pattern.test(text)) {
        matched.push(patternStr);
      }
    } catch (err) {
      // Ignore invalid patterns
    }
  });

  return matched;
}

/**
 * Calculate ambiguity level from scores
 *
 * @param {Object} scores - Type scores object
 * @returns {number} Ambiguity level (0.0 - 1.0)
 * @private
 */
function calculateAmbiguity(scores) {
  const sortedScores = Object.values(scores).sort((a, b) => b - a);

  if (sortedScores[0] === 0) {
    return 1.0; // Complete ambiguity (no type detected)
  }

  // Calculate gap between top 2 scores
  const gap = sortedScores[0] - (sortedScores[1] || 0);

  // Ambiguity is inverse of gap (small gap = high ambiguity)
  const ambiguity = 1 - Math.min(1.0, gap);

  return ambiguity;
}

/**
 * Apply fallback rules when no clear type detected
 *
 * @param {Object} task - Task object
 * @param {Object} scores - Type scores
 * @returns {Object} Fallback classification result
 * @private
 */
function applyFallbackRules(task, scores) {
  // Strategy 1: Check task metadata for hints
  if (task.metadata?.type) {
    return {
      primaryType: task.metadata.type,
      secondaryTypes: [],
      confidence: 0.5,
      fallbackReason: 'metadata-hint',
      allScores: scores,
      metadata: {
        matchedPatterns: [],
        ambiguityLevel: 1.0
      }
    };
  }

  // Strategy 2: Use highest score even if below threshold
  const sortedTypes = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);

  if (sortedTypes[0][1] > 0) {
    return {
      primaryType: sortedTypes[0][0],
      secondaryTypes: [],
      confidence: sortedTypes[0][1],
      fallbackReason: 'best-available',
      allScores: scores,
      metadata: {
        matchedPatterns: [],
        ambiguityLevel: calculateAmbiguity(scores)
      }
    };
  }

  // Strategy 3: Default to "general" type
  return {
    primaryType: 'general',
    secondaryTypes: [],
    confidence: 0.2,
    fallbackReason: 'default-fallback',
    allScores: scores,
    metadata: {
      matchedPatterns: [],
      ambiguityLevel: 1.0
    }
  };
}

/**
 * Normalize task text for analysis
 *
 * @param {Object} task - Task object
 * @returns {string} Normalized text
 * @private
 */
function normalizeTaskText(task) {
  // Combine all text sources
  const parts = [
    task.title || '',
    task.description || '',
    (task.acceptance_criteria || []).join(' '),
    (task.tags || []).join(' ')
  ];

  let text = parts.join(' ');

  // 1. Convert to lowercase
  text = text.toLowerCase();

  // 2. Remove punctuation (keep hyphens for compound words)
  text = text.replace(/[^\w\s-]/g, ' ');

  // 3. Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // 4. Expand common abbreviations
  text = expandAbbreviations(text);

  return text;
}

/**
 * Expand abbreviations in text
 *
 * @param {string} text - Input text
 * @returns {string} Text with expanded abbreviations
 * @private
 */
function expandAbbreviations(text) {
  const patterns = loadPatternLibrary();
  const abbreviations = patterns.abbreviations?.mappings || {};

  Object.entries(abbreviations).forEach(([abbr, full]) => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    text = text.replace(regex, full);
  });

  return text;
}

/**
 * Tokenize text into words
 *
 * @param {string} text - Input text
 * @returns {string[]} Token array
 * @private
 */
function tokenize(text) {
  // Split on whitespace and hyphens
  const tokens = text.split(/[\s-]+/);

  // Remove empty tokens and stopwords
  return tokens.filter(token =>
    token.length > 2 && !isStopword(token)
  );
}

/**
 * Check if word is a stopword
 *
 * @param {string} word - Word to check
 * @returns {boolean} True if stopword
 * @private
 */
function isStopword(word) {
  const patterns = loadPatternLibrary();
  const stopwords = new Set(patterns.stopwords || []);
  return stopwords.has(word.toLowerCase());
}

/**
 * Generate summary statistics from classifications
 *
 * @param {Object} results - Classification results map
 * @returns {Object} Summary statistics
 * @private
 */
function generateTypeSummary(results) {
  const typeDistribution = {};
  let totalConfidence = 0;
  let totalAmbiguity = 0;
  let count = 0;

  Object.values(results).forEach(classification => {
    const type = classification.primaryType;
    if (type && type !== 'general') {
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    }

    totalConfidence += classification.confidence || 0;
    totalAmbiguity += classification.metadata?.ambiguityLevel || 0;
    count++;
  });

  const uniqueTypes = Object.keys(typeDistribution);

  return {
    totalTasks: count,
    uniqueTypes: uniqueTypes.length,
    typeDistribution,
    avgConfidence: count > 0 ? parseFloat((totalConfidence / count).toFixed(2)) : 0,
    avgAmbiguity: count > 0 ? parseFloat((totalAmbiguity / count).toFixed(2)) : 0,
    mostCommonType: uniqueTypes.length > 0
      ? Object.entries(typeDistribution).sort(([, a], [, b]) => b - a)[0][0]
      : 'general'
  };
}
