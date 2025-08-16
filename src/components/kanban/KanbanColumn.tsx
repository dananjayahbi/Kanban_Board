'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TaskCard } from "./TaskCard"
interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  status: string
  order: number
  dueDate?: string | null
  estimatedHours?: number | null
  boardId: string
  columnId: string
  createdAt: string
  updatedAt: string
}
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableTaskCard } from "./SortableTaskCard"

interface KanbanColumnProps {
  column: {
    id: string
    title: string
    order: number
  }
  tasks: (Task & {
    column: { title: string }
    board: { title: string }
  })[]
  onAddTask: () => void
  onDeleteTask: (taskId: string) => void
  onEditTask: (task: Task) => void
}

export function KanbanColumn({ column, tasks, onAddTask, onDeleteTask, onEditTask }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  const getTaskCount = () => {
    return tasks.length
  }

  return (
    <Card className="flex-1 min-w-[280px] bg-gray-50 border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium text-gray-700">
            {column.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
              {getTaskCount()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddTask}
              className="h-6 w-6 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent 
        ref={setNodeRef}
        className="space-y-2 min-h-[400px] max-h-[600px] overflow-y-auto"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onDelete={onDeleteTask}
              onEdit={onEditTask}
            />
          ))}
        </SortableContext>
      </CardContent>
    </Card>
  )
}