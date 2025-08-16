import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/db'

interface AlertResponse {
  id: string
  title: string
  dueDate: string
  board: { title: string }
  column: { title: string }
  priority: string
}

export async function GET() {
  try {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    const upcomingTasks = await db.task.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: nextWeek
        },
        status: {
          not: 'DONE'
        }
      },
      include: {
        board: true,
        column: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    return NextResponse.json(upcomingTasks as unknown as AlertResponse[])
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}