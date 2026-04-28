export type StudentFeatureVector = {
  studentId: string;
  gpa: number | null;
  fieldOfStudy: string;
  preferredCountry: string;
  preferredState?: string;
  engagementScore: number;
};

export class FeatureStore {
  upsertStudentFeatures(vector: StudentFeatureVector) {
    return {
      ...vector,
      updatedAt: new Date().toISOString(),
    };
  }
}

