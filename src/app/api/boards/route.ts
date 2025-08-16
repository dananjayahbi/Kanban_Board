import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/db'

// Define TypeScript interfaces
interface CreateBoardRequest {
  title: string
  description?: string
}

interface BoardResponse {
  id: string
  title: string
  description?: string
  createdAt: string
  updatedAt: string
  columns: Array<{
    id: string
    title: string
    order: number
    boardId: string
    createdAt: string
    updatedAt: string
    tasks?: Array<any>
  }>
}

export async function GET() {
  try {
    // Check database connection
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    const boards = await db.kanbanBoard.findMany({
      include: {
        columns: {
          orderBy: {
            order: 'asc'
          },
          include: {
            tasks: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(boards as unknown as BoardResponse[])
  } catch (error) {
    console.error('Error fetching boards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch boards', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
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
    const { title, description }: CreateBoardRequest = body

    // Validate input
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const board = await db.kanbanBoard.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        columns: {
          create: [
            { title: 'Backlog', order: 0 },
            { title: 'To Do', order: 1 },
            { title: 'In Progress', order: 2 },
            { title: 'Done', order: 3 }
          ]
        }
      },
      include: {
        columns: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json(board as unknown as BoardResponse, { status: 201 })
  } catch (error) {
    console.error('Error creating board:', error)
    return NextResponse.json(
      { error: 'Failed to create board', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}