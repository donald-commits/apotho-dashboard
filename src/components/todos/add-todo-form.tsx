"use client";

import { useRef, useState, useTransition } from "react";
import { createTodo } from "@/app/actions/todos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";

interface Owner {
  id: string;
  name: string;
}

interface AddTodoFormProps {
  businessId: string;
  owners: Owner[];
  meetingId?: string;
}

export function AddTodoForm({ businessId, owners, meetingId }: AddTodoFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createTodo(formData);
      formRef.current?.reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PlusIcon className="mr-1 h-4 w-4" /> Add To-Do
      </Button>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="rounded-lg border p-4 flex flex-col gap-3">
      <input type="hidden" name="businessId" value={businessId} />
      {meetingId && <input type="hidden" name="meetingId" value={meetingId} />}
      <div>
        <Label htmlFor="title">To-Do</Label>
        <Input id="title" name="title" placeholder="What needs to happen?" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
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
        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input id="dueDate" name="dueDate" type="date" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
