#!/usr/bin/env python3
"""Update all API routes to handle auth errors gracefully.

Replaces: `const user = await getOrCreateDemoSession()`
With a version that catches the UNAUTHORIZED throw and returns 401.

Also wraps the rest of the function body in try-catch if needed.
"""
import re
from pathlib import Path

ROOT = Path("/home/z/my-project/src/app/api")
files = list(ROOT.rglob("route.ts"))
print(f"Scanning {len(files)} files...")

updated = 0
for f in files:
    content = f.read_text()
    if "getOrCreateDemoSession" not in content and "requireSession" not in content:
        continue

    original = content

    # Replace bare getOrCreateDemoSession calls with a safe version
    # Pattern: `const user = await getOrCreateDemoSession()` (possibly with whitespace)
    # Replace with a try-catch that returns 401 on error

    # We'll use a different strategy: replace the call with a helper that doesn't throw
    # Change: const user = await getOrCreateDemoSession()
    # To:     const user = await getOrCreateDemoSession().catch(() => { throw new Error("UNAUTHORIZED") })
    # Actually, since getOrCreateDemoSession now calls requireSession which throws,
    # and the route handlers don't catch, we need to wrap.

    # Simplest: wrap each exported async function in try-catch.
    # But that's complex. Instead, let's change getOrCreateDemoSession to return null
    # and have routes check.

    # Actually, let's just change the import to use getSession (returns null) and
    # add a 401 check after.

    # Pattern A: const user = await getOrCreateDemoSession()
    #   -> const user = await getSession(); if (!user) return NextResponse.json({error:"Unauthorized"},{status:401})

    # But getSession is from "@/lib/auth" and returns SessionUser | null
    # And the routes import getOrCreateDemoSession from the same place

    # Let's do: replace "getOrCreateDemoSession" with "getSession" in the call,
    # and add the null check.

    # Step 1: Ensure NextResponse is imported
    if "NextResponse" not in content:
        # Add import
        content = re.sub(
            r'(import \{[^}]+\} from "next/server")',
            r'\1\nimport { NextResponse } from "next/server"',
            content,
            count=1
        )
        # Actually NextResponse is usually already imported via the first import
        # Let's check more carefully
        if 'from "next/server"' in content and "NextResponse" in content.split('from "next/server"')[0]:
            pass  # already imported
        else:
            content = content.replace(
                'import { NextResponse } from "next/server"',
                'import { NextResponse } from "next/server"',
                1
            )

    # Step 2: Replace getOrCreateDemoSession import with getSession
    content = content.replace(
        'import { getOrCreateDemoSession } from "@/lib/auth"',
        'import { getSession } from "@/lib/auth"'
    )
    content = content.replace(
        'import { getOrCreateDemoSession, ',
        'import { getSession, '
    )

    # Step 3: Replace calls
    # const user = await getOrCreateDemoSession() -> const user = await getSession(); if (!user) return NextResponse.json({error:"Unauthorized"},{status:401})
    content = re.sub(
        r'const user = await getOrCreateDemoSession\(\)',
        'const user = await getSession()\n  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })',
        content
    )

    # Fix any remaining getOrCreateDemoSession references (in comments etc.) - leave them

    if content != original:
        f.write_text(content)
        updated += 1
        print(f"  Updated: {f}")

print(f"\nUpdated {updated} files")
