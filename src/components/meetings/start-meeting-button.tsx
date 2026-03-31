"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { startMeeting } from "@/app/actions/meetings";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "lucide-react";

interface StartMeetingButtonProps {
  businessId: string;
  businessSlug: string;
  label?: string;
}

export function StartMeetingButton({ businessId, businessSlug, label = "Start Meeting" }: StartMeetingButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      onClick={() =>
        startTransition(async () => {
          const meetingId = await startMeeting(businessId);
          router.push(`/${businessSlug}/meetings/${meetingId}`);
        })
      }
      disabled={isPending}
    >
      <PlayIcon className="mr-2 h-4 w-4" />
      {isPending ? "Starting..." : label}
    </Button>
  );
}
