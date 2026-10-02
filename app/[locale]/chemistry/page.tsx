import type { Metadata } from 'next';
import { SubjectHub } from '@/components/content/SubjectHub';
import { getSubjectResourceCounts } from '@/lib/subject-content';

export const metadata: Metadata = {
  title: 'Chemistry learning hub',
  description: 'Explore chemistry equations, practical experiments, simulations and quizzes in one subject-focused hub.'
};

export default function ChemistryPage() {
  return <SubjectHub subject="chemistry" counts={getSubjectResourceCounts('chemistry')} />;
}
