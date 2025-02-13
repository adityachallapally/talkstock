'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/dashboard/LoadingScreen'

export default function ProcessingPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  useEffect(() => {
    // After 5 seconds, redirect to the video view page
    const timeout = setTimeout(() => {
      router.push(`/dashboard/videos/view/${params.id}`)
    }, 5000)

    return () => clearTimeout(timeout)
  }, [params.id, router])

  return <LoadingScreen isOpen={true} onOpenChange={() => {}} />
} 