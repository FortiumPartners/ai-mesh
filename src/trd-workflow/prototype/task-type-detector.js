/**
 * Task Type Detection Prototype
 *
 * @module task-type-detector
 * @description Prototype implementation of task type detection algorithm (TASK-TYPE-001)
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-006
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load pattern library
let patternLibrary = null;

/**
 * Load pattern library from JSON file
 *
 * @returns {Object} Pattern library object
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
 * Detect task types for an array of tasks
 *
 * @param {Object[]} tasks - Array of task objects
 * @param {Object} options - Detection options
 * @returns {Object} Map of task IDs to type classifications
 */
export function analyzeTaskTypes(tasks, options = {}) {
  const patterns = loadPatternLibrary();
  const results = {};

  tasks.forEach(task => {
    results[task.id] = detectTaskType(task, patterns, options);
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
 * @param {Object} task - Task object with title, description, acceptance criteria
 * @param {Object} patternLibrary - Loaded detection patterns
 * @param {Object} options - Detection options (thresholds, fallback behavior)
 * @returns {Object} Classification result with primary type, secondary types, confidence
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
    scores[type] = calculateTypeScore(tokens, patternLibrary.types[type], patternLibrary);
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
    return applyFallbackRules(task, scores, patternLibrary);
  }

  return {
    primaryType,
    secondaryTypes,
    confidence: primaryType ? scores[primaryType] : 0,
    allScores: scores,
    metadata: {
      matchedPatterns: extractMatchedPatterns(taskText, patternLibrary, primaryType),
      ambiguityLevel: calculateAmbiguity(scores)
    }
  };
}

/**
 * Calculate confidence score for a specific task type
 *
 * @param {Array<string>} tokens - Normalized word tokens from task
 * @param {Object} typeConfig - Configuration for this task type
 * @param {Object} patternLibrary - Full pattern library for context
 * @returns {number} Confidence score (0.0 - 1.0)
 */
function calculateTypeScore(tokens, typeConfig, patternLibrary) {
  let score = 0;

  // 1. Keyword matching (50% weight)
  const keywordScore = matchKeywords(tokens, typeConfig.keywords);
  score += keywordScore.score * 0.5;

  // 2. Pattern matching (30% weight)
  const text = tokens.join(' ');
  const patternScore = matchPatterns(text, typeConfig.patterns);
  score += patternScore.score * 0.3;

  // 3. Context word presence (20% weight)
  const contextScore = matchContextWords(tokens, typeConfig.context_words);
  score += contextScore.score * 0.2;

  // Apply exclusion patterns (reduce score if present)
  const exclusionPenalty = applyExclusionPatterns(tokens, typeConfig.exclusions || []);
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
 */
function matchKeywords(tokens, keywords) {
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
    ? (totalWeight / tokens.length) * (matchCount / normalizedKeywords.length)
    : 0;

  return {
    count: matchCount,
    score: Math.min(1.0, score)
  };
}

/**
 * Match regex patterns in text
 *
 * @param {string} text - Full text string
 * @param {string[]} patterns - Array of regex pattern strings
 * @returns {Object} Match result with count and score
 */
function matchPatterns(text, patterns) {
  let matchCount = 0;
  const matchedPatterns = [];

  patterns.forEach(patternStr => {
    // Convert pattern string to RegExp
    const match = patternStr.match(/^\/(.+)\/([gimuy]*)$/);
    if (!match) return;

    const pattern = new RegExp(match[1], match[2]);
    if (pattern.test(text)) {
      matchCount++;
      matchedPatterns.push(patternStr);
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
 * @param {string[]} tokens - Token array
 * @param {string[]} exclusions - Exclusion patterns
 * @returns {number} Penalty score
 */
function applyExclusionPatterns(tokens, exclusions) {
  if (!exclusions || exclusions.length === 0) return 0;

  const text = tokens.join(' ');
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
 */
function extractMatchedPatterns(text, patternLibrary, primaryType) {
  if (!primaryType || !patternLibrary.types[primaryType]) {
    return [];
  }

  const typeConfig = patternLibrary.types[primaryType];
  const matched = [];

  typeConfig.patterns.forEach(patternStr => {
    const match = patternStr.match(/^\/(.+)\/([gimuy]*)$/);
    if (!match) return;

    const pattern = new RegExp(match[1], match[2]);
    if (pattern.test(text)) {
      matched.push(patternStr);
    }
  });

  return matched;
}

/**
 * Calculate ambiguity level from scores
 *
 * @param {Object} scores - Type scores object
 * @returns {number} Ambiguity level (0.0 - 1.0)
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
 * @param {Object} patternLibrary - Pattern library
 * @returns {Object} Fallback classification result
 */
function applyFallbackRules(task, scores, patternLibrary) {
  // Strategy 1: Check task metadata for hints
  if (task.metadata?.type) {
    return {
      primaryType: task.metadata.type,
      secondaryTypes: [],
      confidence: 0.5,
      fallbackReason: 'metadata-hint',
      allScores: scores
    };
  }

  // Strategy 2: Default to "general" type
  return {
    primaryType: 'general',
    secondaryTypes: [],
    confidence: 0.2,
    fallbackReason: 'default-fallback',
    allScores: scores
  };
}

/**
 * Normalize task text for analysis
 *
 * @param {Object} task - Task object
 * @returns {string} Normalized text
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
    avgConfidence: count > 0 ? (totalConfidence / count).toFixed(2) : 0,
    avgAmbiguity: count > 0 ? (totalAmbiguity / count).toFixed(2) : 0,
    mostCommonType: uniqueTypes.length > 0
      ? Object.entries(typeDistribution).sort(([, a], [, b]) => b - a)[0][0]
      : 'general'
  };
}
