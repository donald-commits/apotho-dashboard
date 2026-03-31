"use client";

import { useRef, useState, useTransition } from "react";
import { createRock } from "@/app/actions/rocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";

interface Owner {
  id: string;
  name: string;
}

interface AddRockFormProps {
  businessId: string;
  businessSlug: string;
  owners: Owner[];
  defaultQuarter: number;
  defaultYear: number;
}

export function AddRockForm({ businessId, owners, defaultQuarter, defaultYear }: AddRockFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createRock(formData);
      formRef.current?.reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PlusIcon className="mr-1 h-4 w-4" /> Add Rock
      </Button>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="rounded-lg border p-4 flex flex-col gap-3">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="quarter" value={defaultQuarter} />
      <input type="hidden" name="year" value={defaultYear} />
      <div>
        <Label htmlFor="title">Rock Title</Label>
        <Input id="title" name="title" placeholder="What needs to be done this quarter?" required />
      </div>
      <div>
        <Label htmlFor="ownerId">Owner</Label>
        <select
          id="ownerId"
          name="ownerId"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          {owners.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Save Rock"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
