"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { updateBoard, deleteBoard } from "@/app/boards/actions";

export default function BoardActions({ board }: { board: { id: string; title: string; description: string | null; color: string | null } }) {
  const [open, setOpen] = React.useState(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
          </DialogTrigger>
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>Edit Board</DialogTitle>
            </DialogHeader>
            <form action={async (fd) => { await updateBoard(fd); setOpen(false); }} className="space-y-4">
              <input type="hidden" name="id" value={board.id} />
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`title-${board.id}`}>Title</label>
                <Input name="title" id={`title-${board.id}`} defaultValue={board.title} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`desc-${board.id}`}>Description</label>
                <Textarea name="description" id={`desc-${board.id}`} defaultValue={board.description ?? ""} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`color-${board.id}`}>Accent Color</label>
                <Input name="color" id={`color-${board.id}`} type="color" defaultValue={board.color ?? "#6366f1"} />
              </div>
              <DialogFooter>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <form action={deleteBoard} onClick={(e) => e.stopPropagation()}>
          <input type="hidden" name="id" value={board.id} />
          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
            <Button type="submit" variant="ghost" className="w-full justify-start text-red-600">
              Delete
            </Button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
