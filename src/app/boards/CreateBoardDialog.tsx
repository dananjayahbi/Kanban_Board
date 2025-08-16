"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { createBoard } from "./actions";

export default function CreateBoardDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          New Board
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Board</DialogTitle>
          <DialogDescription>Create a new board with default columns.</DialogDescription>
        </DialogHeader>
        <form action={async (fd) => { await createBoard(fd); setOpen(false); }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="title">Title</label>
            <Input name="title" id="title" placeholder="e.g. Personal Projects" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="description">Description</label>
            <Textarea name="description" id="description" placeholder="Optional" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="color">Accent Color</label>
            <Input name="color" id="color" type="color" defaultValue="#6366f1" />
          </div>
          <DialogFooter>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
