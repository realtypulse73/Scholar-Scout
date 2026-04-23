import { StudentFeatureVector } from '../feature-store/feature-store';

export class AcceptanceModel {
  predictAcceptance(vector: StudentFeatureVector) {
    const gpaWeight = vector.gpa ? vector.gpa / 4 : 0.5;
    const engagementWeight = Math.min(vector.engagementScore / 100, 1);

    return Number((gpaWeight * 0.6 + engagementWeight * 0.4).toFixed(2));
  }
}

