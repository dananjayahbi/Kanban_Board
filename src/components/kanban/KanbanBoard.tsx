'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCorners } from '@dnd-kit/core'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings, AlertTriangle } from "lucide-react"
import { KanbanColumn } from "./KanbanColumn"

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

interface Board {
  id: string
  title: string
  description?: string | null
  columns: {
    id: string
    title: string
    order: number
  }[]
  tasks: (Task & {
    column: { title: string }
    board: { title: string }
  })[]
}

interface Alert {
  id: string
  title: string
  dueDate: string
  board: { title: string }
  column: { title: string }
  priority: string
}

interface KanbanBoardProps {
  board: Board
  alerts: Alert[]
  onTaskUpdate: (taskId: string, updates: any) => void
  onTaskDelete: (taskId: string) => void
  onTaskCreate: (taskData: any) => void
}

export function KanbanBoard({ board, alerts, onTaskUpdate, onTaskDelete, onTaskCreate }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedColumnId, setSelectedColumnId] = useState<string>(board.columns[0]?.id || '')
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    estimatedHours: ''
  })
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (over) {
      setSelectedColumnId(over.id as string)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const taskId = active.id as string
    const newColumnId = over.id as string

    if (taskId && newColumnId && newColumnId !== selectedColumnId) {
      await onTaskUpdate(taskId, { columnId: newColumnId })
    }

    setActiveId(null)
    setSelectedColumnId(board.columns[0]?.id || '')
  }

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return

    await onTaskCreate({
      ...newTask,
      boardId: board.id,
      columnId: selectedColumnId
    })

    setNewTask({
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: '',
      estimatedHours: ''
    })
    setIsCreateDialogOpen(false)
  }

  const getTasksByColumn = (columnId: string) => {
    return board.tasks.filter(task => task.columnId === columnId)
  }

  const formatAlertDate = (dateString: string) => {
    if (!isClient) return dateString
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{board.title}</h1>
            {board.description && (
              <p className="text-gray-600">{board.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Enter task title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Enter task description"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="column">Column</Label>
                    <Select value={selectedColumnId} onValueChange={setSelectedColumnId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {board.columns.map((column) => (
                          <SelectItem key={column.id} value={column.id}>
                            {column.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="estimatedHours">Est. Hours</Label>
                      <Input
                        id="estimatedHours"
                        type="number"
                        value={newTask.estimatedHours}
                        onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTask}>
                    Create Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-orange-800">Upcoming Deadlines</h3>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded border border-orange-100">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{alert.title}</p>
                    <p className="text-xs text-gray-600">{alert.board.title} • {alert.column.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${
                      alert.priority === 'HIGH' ? 'bg-red-100 text-red-800 border-red-200' :
                      alert.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-green-100 text-green-800 border-green-200'
                    }`}>
                      {alert.priority}
                    </Badge>
                    <span className="text-xs text-orange-600 font-medium">
                      {formatAlertDate(alert.dueDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {board.columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={getTasksByColumn(column.id)}
              onAddTask={() => {
                setSelectedColumnId(column.id)
                setIsCreateDialogOpen(true)
              }}
              onDeleteTask={onTaskDelete}
              onEditTask={(task) => {
                // TODO: Implement edit functionality
                console.log('Edit task:', task)
              }}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}