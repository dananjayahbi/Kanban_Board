"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";
import { updateBoard, deleteBoard } from "@/app/boards/actions";
import * as Lucide from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function BoardActions({ board }: { board: { id: string; title: string; description: string | null; color: string | null } }) {
  const [open, setOpen] = React.useState(false);
  const [icon, setIcon] = React.useState((board as any).icon || "");
  const allIconNames = React.useMemo(() => Object.keys(Lucide).filter((k) => /^[A-Z]/.test(k)), []);
  const [iconSearch, setIconSearch] = React.useState("");
  const [page, setPage] = React.useState(0);
  const pageSize = 24;
  const filtered = React.useMemo(() => allIconNames.filter((n) => n.toLowerCase().includes(iconSearch.toLowerCase())), [allIconNames, iconSearch]);
  const paged = filtered.slice(page * pageSize, page * pageSize + pageSize);
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
            <form action={async (fd) => { if (icon) fd.set("icon", icon); await updateBoard(fd); setOpen(false); }} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
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
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`icon-${board.id}`}>Icon (Lucide name)</label>
                <Input id={`icon-${board.id}`} placeholder="e.g. FolderKanban" value={icon} onChange={(e) => setIcon(e.target.value)} />
                <div className="text-xs text-muted-foreground">Leave blank to keep current.</div>
                {(() => {
                  const P = (Lucide as any)[icon];
                  return P ? <div className="mt-1 flex items-center gap-2 text-sm"><P className="h-4 w-4" /> Preview</div> : null;
                })()}
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Pick an icon</label>
                    <div className="flex items-center gap-2">
                      <Input placeholder="Search icons" value={iconSearch} onChange={(e) => { setIconSearch(e.target.value); setPage(0); }} className="h-8 w-40" />
                      <div className="text-xs text-muted-foreground">{filtered.length} results</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-2 max-h-48 overflow-auto border rounded-md p-2">
                    {paged.map((name) => {
                      const P = (Lucide as any)[name];
                      if (!P) return null;
                      const active = icon === name;
                      return (
                        <button type="button" key={name} onClick={() => setIcon(name)} className={`flex flex-col items-center justify-center gap-1 border rounded p-2 hover:bg-accent ${active ? "bg-accent" : ""}`} title={name}>
                          <P className="h-5 w-5" />
                          <span className="text-[10px] truncate w-full">{name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <Button type="button" size="sm" variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
                    <div className="text-xs">Page {page + 1} / {Math.max(1, Math.ceil(filtered.length / pageSize))}</div>
                    <Button type="button" size="sm" variant="outline" onClick={() => setPage((p) => (p + 1 < Math.ceil(filtered.length / pageSize) ? p + 1 : p))} disabled={(page + 1) >= Math.ceil(filtered.length / pageSize)}>Next</Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <SubmitButton>Save</SubmitButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Delete…</DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete board?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone and will remove all lists and tasks in this board.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <form action={deleteBoard}>
                <input type="hidden" name="id" value={board.id} />
                <SubmitButton variant="destructive" className="gap-2"><Trash2 className="h-4 w-4" /> Delete</SubmitButton>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
