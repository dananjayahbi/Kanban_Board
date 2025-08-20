import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createPriority, deletePriority, updatePriority } from "@/app/boards/actions";

export const dynamic = "force-dynamic";

async function getPriorities() {
  return prisma.priorityLabel.findMany({ orderBy: { level: "asc" } });
}

export default async function PrioritiesPage() {
  const list = await getPriorities();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Priority Labels</h1>
        <CreateDialog />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} /> {p.name}</span>
                <EditDialog item={p} />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground flex items-center justify-between">
              <div>Level: {p.level}</div>
              <form action={deletePriority}><input type="hidden" name="id" value={p.id} /><Button size="sm" variant="ghost" className="text-red-600">Delete</Button></form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreateDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">New Label</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Priority Label</DialogTitle></DialogHeader>
  <form action={createPriority} className="space-y-4">
          <div className="space-y-2"><label className="text-sm font-medium" htmlFor="name">Name</label><Input id="name" name="name" required /></div>
          <div className="space-y-2"><label className="text-sm font-medium" htmlFor="color">Color</label><Input id="color" name="color" type="color" defaultValue="#ef4444" /></div>
          <div className="space-y-2"><label className="text-sm font-medium" htmlFor="level">Level</label><Input id="level" name="level" type="number" defaultValue={0} /></div>
          <DialogFooter><SubmitButton>Create</SubmitButton></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({ item }: { item: { id: string; name: string; color: string; level: number } }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Priority</DialogTitle></DialogHeader>
  <form action={updatePriority} className="space-y-4">
          <input type="hidden" name="id" value={item.id} />
          <div className="space-y-2"><label className="text-sm font-medium" htmlFor={`name-${item.id}`}>Name</label><Input id={`name-${item.id}`} name="name" defaultValue={item.name} required /></div>
          <div className="space-y-2"><label className="text-sm font-medium" htmlFor={`color-${item.id}`}>Color</label><Input id={`color-${item.id}`} name="color" type="color" defaultValue={item.color} /></div>
          <div className="space-y-2"><label className="text-sm font-medium" htmlFor={`level-${item.id}`}>Level</label><Input id={`level-${item.id}`} name="level" type="number" defaultValue={item.level} /></div>
          <DialogFooter><SubmitButton>Save</SubmitButton></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
