import { queryMemories, getMemoryStats } from './engine';

// ============================================================
// Memory IQ Scoring System
//
// Grades:
//   Client Knowledge  25%
//   Process Mastery    25%
//   Relational Intel   20%
//   Predictive Accuracy 20%
//   Error Learning     10%
//
// Levels: Apprentice → Practitioner → Expert → Master → Genius
// ============================================================

export interface IQScore {
  clientKnowledge: number;
  processMastery: number;
  relationalIntel: number;
  predictiveAccuracy: number;
  errorLearning: number;
  totalScore: number;
  level: string;
  delta: number;
}

export type IQLevel = 'Apprentice' | 'Practitioner' | 'Expert' | 'Master' | 'Genius';

const levelThresholds: [number, IQLevel][] = [
  [90, 'Genius'],
  [75, 'Master'],
  [60, 'Expert'],
  [40, 'Practitioner'],
  [0, 'Apprentice'],
];

function getLevel(score: number): IQLevel {
  for (const [threshold, level] of levelThresholds) {
    if (score >= threshold) return level;
  }
  return 'Apprentice';
}

// Previous scores for delta calculation
const scoreHistory: Map<string, number> = new Map();

export function calculateIQScore(tenantId: string, previousScore?: number): IQScore {
  const stats = getMemoryStats(tenantId);

  // Client Knowledge (25%) — semantic memories about clients
  const semanticMems = queryMemories({ tenantId, type: 'semantic' });
  const semanticConfidence = semanticMems.length > 0
    ? semanticMems.reduce((sum, m) => sum + m.confidence, 0) / semanticMems.length
    : 0;
  const clientKnowledge = Math.min(100, Math.round(
    (semanticMems.length / 20) * 40 +  // breadth: up to 40 pts for 20+ facts
    semanticConfidence * 60              // quality: up to 60 pts for high confidence
  ));

  // Process Mastery (25%) — procedural memories (SOPs)
  const proceduralMems = queryMemories({ tenantId, type: 'procedural' });
  const sopVersioning = proceduralMems.filter(m => m.version > 1).length;
  const processMastery = Math.min(100, Math.round(
    (proceduralMems.length / 10) * 50 +  // breadth: up to 50 pts for 10+ SOPs
    (sopVersioning / Math.max(1, proceduralMems.length)) * 30 + // iteration: versioned SOPs
    (proceduralMems.length > 0
      ? proceduralMems.reduce((s, m) => s + m.confidence, 0) / proceduralMems.length * 20
      : 0)
  ));

  // Relational Intel (20%) — connection graph density
  const relationalMems = queryMemories({ tenantId, type: 'relational' });
  const totalConnections = stats.connectionCount;
  const relationalIntel = Math.min(100, Math.round(
    (relationalMems.length / 10) * 30 +     // breadth
    (totalConnections / 20) * 40 +           // density
    (relationalMems.length > 0
      ? relationalMems.reduce((s, m) => s + m.confidence, 0) / relationalMems.length * 30
      : 0)
  ));

  // Predictive Accuracy (20%) — predictions made + confidence
  const predictiveMems = queryMemories({ tenantId, type: 'predictive' });
  const avgPredConfidence = predictiveMems.length > 0
    ? predictiveMems.reduce((s, m) => s + m.confidence, 0) / predictiveMems.length
    : 0;
  const predictiveAccuracy = Math.min(100, Math.round(
    (predictiveMems.length / 5) * 40 +
    avgPredConfidence * 60
  ));

  // Error Learning (10%) — episodic memories from overrides + corrections
  const episodicMems = queryMemories({ tenantId, type: 'episodic' });
  const overrideLearnedMems = episodicMems.filter(m =>
    m.sourceType === 'override' || m.content.toLowerCase().includes('learned') || m.content.toLowerCase().includes('override')
  );
  const errorLearning = Math.min(100, Math.round(
    (overrideLearnedMems.length / 5) * 50 +
    (episodicMems.length / 20) * 50
  ));

  // Weighted total
  const totalScore = Math.round(
    clientKnowledge * 0.25 +
    processMastery * 0.25 +
    relationalIntel * 0.20 +
    predictiveAccuracy * 0.20 +
    errorLearning * 0.10
  );

  // Delta from previous
  const prevKey = `${tenantId}:latest`;
  const prevScore = previousScore ?? scoreHistory.get(prevKey) ?? totalScore;
  const delta = totalScore - prevScore;
  scoreHistory.set(prevKey, totalScore);

  return {
    clientKnowledge,
    processMastery,
    relationalIntel,
    predictiveAccuracy,
    errorLearning,
    totalScore,
    level: getLevel(totalScore),
    delta,
  };
}
