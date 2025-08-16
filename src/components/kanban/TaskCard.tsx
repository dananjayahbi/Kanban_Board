'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Clock, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"

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

interface TaskCardProps {
  task: Task & {
    column: { title: string }
    board: { title: string }
  }
  onDelete: (taskId: string) => void
  onEdit: (task: Task) => void
}

export function TaskCard({ task, onDelete, onEdit }: TaskCardProps) {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const isOverdue = task.dueDate && isClient ? new Date(task.dueDate) < new Date() : false
  const formattedDueDate = task.dueDate && isClient ? new Date(task.dueDate).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }) : task.dueDate ? 'Due date' : ''

  return (
    <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow bg-white">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h4 className="font-semibold text-sm text-gray-900">{task.title}</h4>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(task)
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(task.id)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {task.description && (
          <p className="text-xs text-gray-600 mt-1">{task.description}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-between items-center">
          <Badge variant="outline" className={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>
          <div className="flex items-center gap-2">
            {task.estimatedHours && (
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {task.estimatedHours}h
              </div>
            )}
            {task.dueDate && (
              <div className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                {formattedDueDate}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}