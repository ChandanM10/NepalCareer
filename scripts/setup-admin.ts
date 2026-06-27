/**
 * Admin Setup Script
 * Creates or updates the admin user with proper bcrypt password hashing
 * 
 * Usage: npm run ts-node scripts/setup-admin.ts
 */

import { db } from "../src/lib/db.js"
import * as bcrypt from "bcrypt"

const BCRYPT_ROUNDS = 12

async function setupAdmin() {
  console.log("🔐 Setting up admin account...")

  const email = "admin@example.com"
  const plainPassword = "changeme123"
  const fullName = "Chandan Singh"

  try {
    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS)
    console.log("✓ Password hashed with bcrypt")

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } })

    if (existingUser) {
      // Update existing user to admin with new password
      const updated = await db.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: "admin",
          fullName,
          headline: "Founder & Admin · NepalCareer",
        },
      })
      console.log("✓ Updated existing user to admin with new password")
      console.log(`  Email: ${updated.email}`)
      console.log(`  Name: ${updated.fullName}`)
      console.log(`  Role: ${updated.role}`)
    } else {
      // Create new admin user
      const newUser = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          headline: "Founder & Admin · NepalCareer",
          bio: "Admin account for NepalCareer. Managing the platform.",
          location: "Kathmandu, Nepal",
          avatarUrl: null,
          role: "admin",
        },
      })
      console.log("✓ Created new admin user")
      console.log(`  Email: ${newUser.email}`)
      console.log(`  Name: ${newUser.fullName}`)
      console.log(`  Role: ${newUser.role}`)
    }

    console.log("\n✨ Admin setup complete!")
    console.log("\nYou can now login with:")
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${plainPassword}`)
    console.log("\n📋 Admin Features Available:")
    console.log("  • Dashboard: /admin")
    console.log("  • Job Management: /admin/jobs")
    console.log("  • Applications: /api/admin/applications")
    console.log("  • Statistics: /api/admin/stats")
    console.log("\n🔐 Security Features:")
    console.log("  • Full bcrypt password hashing")
    console.log("  • Session management (30-day expiry)")
    console.log("  • Role-based access control")

  } catch (error: any) {
    console.error("❌ Error setting up admin:", error.message)
    process.exit(1)
  }
}

setupAdmin()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
