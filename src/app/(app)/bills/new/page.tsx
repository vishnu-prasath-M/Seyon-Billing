import { Suspense } from "react";
import BillEditor from "@/components/BillEditor";
import { LoadingState } from "@/components/ui";

export default function NewBillPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading bill editor..." />}>
      <BillEditor />
    </Suspense>
  );
}
