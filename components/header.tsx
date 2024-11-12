'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { SignInPopup } from '@/components/SignInPopup'
import { useState } from 'react'

export default function Header() {
  const { data: session, status } = useSession()
  const [isSignInOpen, setIsSignInOpen] = useState(false)

  return (
    <header className="sticky top-0 z-10 container mx-auto px-4 py-4 flex justify-between items-center bg-background border-b">
      <Link href="/" className="flex items-center">
        <Image
          src="/craftclipslogov2.png"
          alt="CraftClips Logo"
          width={150}
          height={40}
          priority
        />
      </Link>
      <nav className="flex items-center space-x-4">
        <Link href="/dashboard/videos/create" className="text-muted-foreground transition-colors hover:text-foreground">
          Dashboard
        </Link>
        {session && (
          <>
            <Link href="/dashboard/upgrade">
              <Button variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
                Upgrade
              </Button>
            </Link>
            <Link href="/dashboard/referral" className="text-muted-foreground transition-colors hover:text-foreground">
              Referral
            </Link>
          </>
        )}
        {status === 'loading' ? (
          <Button variant="outline" disabled>Loading...</Button>
        ) : session ? (
          <Button variant="outline" onClick={() => signOut()}>Sign out</Button>
        ) : (
          <Button variant="outline" onClick={() => setIsSignInOpen(true)}>Sign in</Button>
        )}
      </nav>
      <SignInPopup isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
    </header>
  )
}