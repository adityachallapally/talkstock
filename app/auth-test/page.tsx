"use client"

import { useSession } from "next-auth/react"

export default function SimpleClientPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (status === "unauthenticated") {
    return <div>Not signed in</div>
  }

  return <div>User email: {session?.user?.email}</div>
}