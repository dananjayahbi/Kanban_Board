'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { LoadingCard } from '@/components/ui/loading-spinner'
import { LoadingSkeleton } from '@/components/ui/loading-spinner'
import Link from 'next/link'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Plus, 
  TrendingUp,
  Users,
  Target,
  Database,
  AlertCircle
} from 'lucide-react'

interface Board {
  id: string
  title: string
  description?: string
  createdAt: string
  columns: {
    id: string
    title: string
    order: number
  }[]
  tasks: Task[]
}

interface Task {
  id: string
  title: string
  priority: string
  status: string
  dueDate?: string
  estimatedHours?: number
  boardId: string
  columnId: string
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function Dashboard() {
  const [boards, setBoards] = useState<Board[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDbConnected, setIsDbConnected] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
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
      setIsDbConnected(true)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch data')
      
      if (error instanceof Error && error.message.includes('Database connection failed')) {
        setIsDbConnected(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const getStats = () => {
    const allTasks = boards.flatMap(board => board.tasks)
    const totalTasks = allTasks.length
    const completedTasks = allTasks.filter(task => task.status === 'DONE').length
    const inProgressTasks = allTasks.filter(task => task.status === 'IN_PROGRESS').length
    const todoTasks = allTasks.filter(task => task.status === 'TODO').length
    const overdueTasks = allTasks.filter(task => 
      task.dueDate && isClient && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
    ).length

    const totalEstimatedHours = allTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)

    const priorityDistribution = [
      { name: 'High', value: allTasks.filter(task => task.priority === 'HIGH').length },
      { name: 'Medium', value: allTasks.filter(task => task.priority === 'MEDIUM').length },
      { name: 'Low', value: allTasks.filter(task => task.priority === 'LOW').length }
    ].filter(item => item.value > 0)

    const boardStats = boards.map(board => ({
      name: board.title,
      total: board.tasks.length,
      completed: board.tasks.filter(task => task.status === 'DONE').length,
      inProgress: board.tasks.filter(task => task.status === 'IN_PROGRESS').length,
      todo: board.tasks.filter(task => task.status === 'TODO').length
    }))

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      totalEstimatedHours,
      priorityDistribution,
      boardStats,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    }
  }

  const stats = getStats()

  const formatAlertDate = (dateString: string) => {
    if (!isClient) return dateString
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingCard message="Loading dashboard..." />
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
            <Button onClick={fetchData}>Retry Connection</Button>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline">
                  View Boards
                </Button>
              </Link>
              <Button onClick={fetchData} variant="outline" size="sm">
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Tasks</CardTitle>
                <Target className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.totalTasks}</div>
                <p className="text-xs text-gray-600">
                  Across {boards.length} boards
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
                <p className="text-xs text-gray-600">
                  {stats.completionRate}% completion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</div>
                <p className="text-xs text-gray-600">
                  {stats.todoTasks} tasks to do
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.overdueTasks}</div>
                <p className="text-xs text-gray-600">
                  {alerts.length} upcoming deadlines
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Tasks by Board</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.boardStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.boardStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total" fill="#3b82f6" name="Total" />
                      <Bar dataKey="completed" fill="#10b981" name="Completed" />
                      <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" />
                      <Bar dataKey="todo" fill="#6b7280" name="To Do" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.priorityDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.priorityDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.priorityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No priority data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No upcoming deadlines</p>
              ) : (
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{alert.title}</p>
                        <p className="text-sm text-gray-600">{alert.board.title} • {alert.column.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${
                          alert.priority === 'HIGH' ? 'bg-red-100 text-red-800 border-red-200' :
                          alert.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-green-100 text-green-800 border-green-200'
                        }`}>
                          {alert.priority}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {formatAlertDate(alert.dueDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Board Summary */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Board Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boards.map((board) => {
                const boardTasks = board.tasks
                const completed = boardTasks.filter(task => task.status === 'DONE').length
                const total = boardTasks.length
                const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

                return (
                  <Card key={board.id}>
                    <CardHeader>
                      <CardTitle className="text-gray-900">{board.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Tasks:</span>
                          <span className="font-medium">{total}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Completed:</span>
                          <span className="font-medium text-green-600">{completed}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Completion:</span>
                          <span className="font-medium">{completionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </ErrorBoundary>
      </main>
    </div>
  )
}