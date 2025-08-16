'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { LoadingCard } from '@/components/ui/loading-spinner'
import { AlertCircle, Database } from 'lucide-react'

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

interface Alert {
  id: string
  title: string
  dueDate: string
  board: { title: string }
  column: { title: string }
  priority: string
}

interface ApiError {
  error: string
  details?: string
}

export default function Home() {
  const [boards, setBoards] = useState<Board[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDbConnected, setIsDbConnected] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [boardsResponse, alertsResponse] = await Promise.all([
        fetch('/api/boards'),
        fetch('/api/alerts')
      ])

      if (!boardsResponse.ok) {
        const errorData: ApiError = await boardsResponse.json()
        throw new Error(errorData.error || 'Failed to fetch boards')
      }

      if (!alertsResponse.ok) {
        const errorData: ApiError = await alertsResponse.json()
        throw new Error(errorData.error || 'Failed to fetch alerts')
      }

      const boardsData = await boardsResponse.json()
      const alertsData = await alertsResponse.json()

      setBoards(boardsData)
      setAlerts(alertsData)

      if (boardsData.length > 0 && !selectedBoardId) {
        setSelectedBoardId(boardsData[0].id)
      }

      setIsDbConnected(true)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch data')
      
      // Check if it's a database connection error
      if (error instanceof Error && error.message.includes('Database connection failed')) {
        setIsDbConnected(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: taskId, ...updates }),
      })

      if (!response.ok) {
        const errorData: ApiError = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }

      await fetchData()
    } catch (error) {
      console.error('Error updating task:', error)
      alert(error instanceof Error ? error.message : 'Failed to update task')
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData: ApiError = await response.json()
        throw new Error(errorData.error || 'Failed to delete task')
      }

      await fetchData()
    } catch (error) {
      console.error('Error deleting task:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete task')
    }
  }

  const handleTaskCreate = async (taskData: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        const errorData: ApiError = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }

      await fetchData()
    } catch (error) {
      console.error('Error creating task:', error)
      alert(error instanceof Error ? error.message : 'Failed to create task')
    }
  }

  const handleCreateBoard = async () => {
    try {
      const title = prompt('Enter board title:')
      if (!title?.trim()) return

      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: ''
        }),
      })

      if (!response.ok) {
        const errorData: ApiError = await response.json()
        throw new Error(errorData.error || 'Failed to create board')
      }

      await fetchData()
    } catch (error) {
      console.error('Error creating board:', error)
      alert(error instanceof Error ? error.message : 'Failed to create board')
    }
  }

  const selectedBoard = boards.find(board => board.id === selectedBoardId)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingCard message="Loading your Kanban boards..." />
      </div>
    )
  }

  if (error && !isDbConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center">
            <Database className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Database Connection Error</h2>
            <p className="text-gray-600 mb-6">
              Unable to connect to the database. Please check your MongoDB connection string in the .env file.
            </p>
            <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left">
              <p className="text-sm text-gray-700 mb-2">Make sure your .env file contains:</p>
              <code className="text-xs bg-gray-200 p-2 rounded block">
                DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/kanban-app?retryWrites=true&w=majority"
              </code>
            </div>
            <Button onClick={fetchData} className="mr-2">
              Retry Connection
            </Button>
            <Button variant="outline" onClick={handleCreateBoard}>
              Create Sample Board
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={fetchData}>Retry</Button>
        </div>
      </div>
    )
  }

  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No Kanban Boards Found</h1>
        <p className="text-gray-600 mb-6">Create your first Kanban board to get started</p>
        <Button
          onClick={handleCreateBoard}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Create First Board
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Kanban Board Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">
                  Dashboard
                </Button>
              </Link>
              <select
                value={selectedBoardId || ''}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.title}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleCreateBoard}
                className="bg-blue-600 hover:bg-blue-700"
              >
                New Board
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <ErrorBoundary>
          {selectedBoard && (
            <KanbanBoard
              board={selectedBoard}
              alerts={alerts.filter(alert => alert.board.title === selectedBoard.title)}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onTaskCreate={handleTaskCreate}
            />
          )}
        </ErrorBoundary>
      </main>
    </div>
  )
}