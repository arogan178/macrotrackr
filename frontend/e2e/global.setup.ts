import { clerkSetup } from '@clerk/testing/playwright'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load test environment variables
dotenv.config({ path: resolve(__dirname, '..', '.env.test') })

// Debug: Log env var status
console.log('Global Setup - CLERK_PUBLISHABLE_KEY:', process.env.CLERK_PUBLISHABLE_KEY ? 'Set' : 'Not set')
console.log('Global Setup - CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? 'Set' : 'Not set')

async function globalSetup() {
  // This sets up the Clerk testing token
  // It requires CLERK_SECRET_KEY to be set in environment
  await clerkSetup()
  console.log('Clerk setup completed')
}

export default globalSetup
