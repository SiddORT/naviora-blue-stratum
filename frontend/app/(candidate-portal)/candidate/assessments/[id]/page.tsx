import { CandidateAssessmentDetailView } from "@/features/candidate-portal/CandidateAssessmentDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CandidateAssessmentDetailPage({ params }: Props) {
  const { id } = await params;
  return <CandidateAssessmentDetailView uuid={id} />;
}
