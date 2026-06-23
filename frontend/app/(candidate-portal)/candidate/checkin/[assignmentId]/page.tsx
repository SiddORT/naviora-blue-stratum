import { CandidateCheckinWizard } from "@/features/candidate-portal/CandidateCheckinWizard";

interface Props {
  params: Promise<{ assignmentId: string }>;
}

export default async function CandidateCheckinPage({ params }: Props) {
  const { assignmentId } = await params;
  return <CandidateCheckinWizard assignmentUuid={assignmentId} />;
}
