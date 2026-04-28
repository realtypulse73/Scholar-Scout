import { StudentFeatureVector } from '../feature-store/feature-store';

export class RecommendationScoringService {
  score(vector: StudentFeatureVector, banditBoost = 0, upliftScore = 0) {
    const baseScore = (vector.gpa ?? 2.5) * 15 + vector.engagementScore * 0.4;
    return Math.round(baseScore + banditBoost + upliftScore);
  }
}

