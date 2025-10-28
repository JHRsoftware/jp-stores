import { getDbConnection } from '@/app/db';
import { NextResponse } from 'next/server';

// Cache for login attempts to prevent brute force attacks
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export async function POST(request) {
  const startTime = performance.now();
  
  try {
    const { username, password } = await request.json();

    // Input validation
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const attemptKey = `${clientIP}-${username}`;
    const attempts = loginAttempts.get(attemptKey);

    if (attempts && attempts.count >= MAX_ATTEMPTS && (Date.now() - attempts.lastAttempt) < LOCKOUT_DURATION) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const db = await getDbConnection();
    
    // Optimized query with prepared statement and limited fields
    const [rows] = await db.execute(
      'SELECT username, access_pages FROM users WHERE username = ? AND password = ? LIMIT 1',
      [username, password]
    );

    if (rows.length > 0) {
      // Reset failed attempts on successful login
      loginAttempts.delete(attemptKey);
      
      const user = rows[0];
      const accessPages = user.access_pages ? user.access_pages.split(',') : [];
      
      const endTime = performance.now();
      console.log(`Login successful for ${username} in ${endTime - startTime}ms`);
      
      return NextResponse.json(
        { 
          success: true, 
          user: { 
            username: user.username, 
            accessPages: accessPages 
          },
          performance: {
            responseTime: Math.round(endTime - startTime)
          }
        },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    } else {
      // Track failed attempts
      const currentAttempts = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };
      loginAttempts.set(attemptKey, {
        count: currentAttempts.count + 1,
        lastAttempt: Date.now()
      });

      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
