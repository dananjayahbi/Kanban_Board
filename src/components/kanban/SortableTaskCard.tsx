'use client'

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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

interface SortableTaskCardProps {
  task: Task & {
    column: { title: string }
    board: { title: string }
  }
  onDelete: (taskId: string) => void
  onEdit: (task: Task) => void
}

export function SortableTaskCard({ task, onDelete, onEdit }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </div>
  )
}