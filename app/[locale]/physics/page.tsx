import type { Metadata } from 'next';
import { SubjectHub } from '@/components/content/SubjectHub';
import { getSubjectResourceCounts } from '@/lib/subject-content';

export const metadata: Metadata = {
  title: 'Physics learning hub',
  description: 'Explore physics equations, practical experiments, simulations and quizzes in one subject-focused hub.'
};

export default function PhysicsPage() {
  return <SubjectHub subject="physics" counts={getSubjectResourceCounts('physics')} />;
}
