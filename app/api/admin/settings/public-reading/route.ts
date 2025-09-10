import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { UserRole } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const maxDuration = 60; // 1 minute
export const runtime = 'nodejs';

/**
 * GET /api/admin/settings/public-reading
 * 
 * Returns the current global public reading toggle status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin authorization
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Get global public reading setting
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'global_public_reading' },
      include: {
        updater: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    const defaultValue = {
      enabled: false,
      enabledAt: null,
      reason: null,
      duration: null,
      autoDisableAt: null
    }

    return NextResponse.json({
      success: true,
      setting: setting ? {
        key: setting.key,
        value: setting.valueJson,
        description: setting.description,
        updatedAt: setting.updatedAt.toISOString(),
        updatedBy: setting.updater
      } : {
        key: 'global_public_reading',
        value: defaultValue,
        description: 'Global toggle to make all books publicly accessible',
        updatedAt: null,
        updatedBy: null
      }
    })

  } catch (error) {
    console.error('Error fetching public reading setting:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch public reading setting',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/settings/public-reading
 * 
 * Updates the global public reading toggle
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin authorization
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { enabled, reason, duration } = await request.json()

    // Validate input
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled field must be a boolean' },
        { status: 400 }
      )
    }

    const now = new Date()
    let autoDisableAt = null

    // If enabling with duration, calculate auto-disable time
    if (enabled && duration && typeof duration === 'number' && duration > 0) {
      autoDisableAt = new Date(now.getTime() + duration * 60 * 60 * 1000) // duration in hours
    }

    const settingValue = {
      enabled,
      enabledAt: enabled ? now.toISOString() : null,
      disabledAt: !enabled ? now.toISOString() : null,
      reason: reason || null,
      duration: duration || null,
      autoDisableAt: autoDisableAt ? autoDisableAt.toISOString() : null
    }

    // Upsert the setting
    const setting = await prisma.platformSetting.upsert({
      where: { key: 'global_public_reading' },
      create: {
        key: 'global_public_reading',
        valueJson: settingValue,
        description: 'Global toggle to make all books publicly accessible',
        updatedBy: session.user.id,
        updatedAt: now
      },
      update: {
        valueJson: settingValue,
        updatedBy: session.user.id,
        updatedAt: now
      },
      include: {
        updater: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Log the change for audit purposes
    console.log('Global public reading setting changed:', {
      changedBy: session.user.email,
      previousState: 'unknown', // In a real app, you'd track this
      newState: settingValue,
      timestamp: now.toISOString()
    })

    return NextResponse.json({
      success: true,
      message: `Global public reading ${enabled ? 'enabled' : 'disabled'} successfully`,
      setting: {
        key: setting.key,
        value: setting.valueJson,
        description: setting.description,
        updatedAt: setting.updatedAt.toISOString(),
        updatedBy: setting.updater
      }
    })

  } catch (error) {
    console.error('Error updating public reading setting:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update public reading setting',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}