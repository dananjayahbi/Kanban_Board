"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import * as Lucide from "lucide-react";
import { Plus, Dice6 } from "lucide-react";
import { createBoard } from "./actions";

export default function CreateBoardDialog() {
  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState("");
  const Icon = (Lucide as any)[icon as keyof typeof Lucide] as React.ComponentType<any> | undefined;
  const allIconNames = useMemo(() => Object.keys(Lucide).filter((k) => /^[A-Z]/.test(k)), []);
  const [iconSearch, setIconSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 24;
  const filtered = useMemo(() => allIconNames.filter((n) => n.toLowerCase().includes(iconSearch.toLowerCase())), [allIconNames, iconSearch]);
  const paged = filtered.slice(page * pageSize, page * pageSize + pageSize);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          New Board
        </Button>
      </DialogTrigger>
  <DialogContent className="max-h-[75vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Board</DialogTitle>
          <DialogDescription>Create a new board with default columns.</DialogDescription>
        </DialogHeader>
        <form action={async (fd) => { if (icon) fd.set("icon", icon); await createBoard(fd); setOpen(false); }} className="space-y-4">
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" htmlFor="icon">Icon (Lucide name)</label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" title="Random icon" onClick={() => {
                  const pool = ["FolderKanban","LayoutGrid","ClipboardList","Rocket","Layers","CalendarDays","Kanban","ListChecks"]; // same as server
                  const pick = pool[Math.floor(Math.random()*pool.length)];
                  setIcon(pick);
                }}>
                  <Dice6 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Input id="icon" placeholder="e.g. FolderKanban" value={icon} onChange={(e) => setIcon(e.target.value)} />
            <div className="text-xs text-muted-foreground">Leave blank to auto-pick a random icon.</div>
            {Icon && (
              <div className="mt-1 flex items-center gap-2 text-sm"><Icon className="h-4 w-4" /> Preview</div>
            )}
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
            <SubmitButton>Create</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
