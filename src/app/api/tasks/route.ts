import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/db'

// Define TypeScript interfaces
interface CreateTaskRequest {
  title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: string
  estimatedHours?: number
  boardId: string
  columnId: string
}

interface UpdateTaskRequest {
  id: string
  title?: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: string | null
  estimatedHours?: number | null
  columnId?: string
  order?: number
}

export async function POST(request: NextRequest) {
  try {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { title, description, priority, dueDate, estimatedHours, boardId, columnId }: CreateTaskRequest = body

    // Validate input
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (!boardId || !columnId) {
      return NextResponse.json(
        { error: 'Board ID and Column ID are required' },
        { status: 400 }
      )
    }

    if (!['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
      return NextResponse.json(
        { error: 'Priority must be LOW, MEDIUM, or HIGH' },
        { status: 400 }
      )
    }

    const task = await db.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours || null,
        boardId,
        columnId,
        order: 0 // Add default order
      },
      include: {
        column: true,
        board: true
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { id, title, description, priority, dueDate, estimatedHours, columnId, order }: UpdateTaskRequest = body

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title must be a non-empty string' },
          { status: 400 }
        )
      }
      updateData.title = title.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (priority !== undefined) {
      if (!['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
        return NextResponse.json(
          { error: 'Priority must be LOW, MEDIUM, or HIGH' },
          { status: 400 }
        )
      }
      updateData.priority = priority
    }

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null
    }

    if (estimatedHours !== undefined) {
      updateData.estimatedHours = estimatedHours || null
    }

    if (columnId !== undefined) {
      updateData.columnId = columnId
    }

    if (order !== undefined) {
      updateData.order = order
    }

    const task = await db.task.update({
      where: { id },
      data: updateData,
      include: {
        column: true,
        board: true
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    await db.task.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}