'use client'
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from 'next/navigation'
import { VideoSchema, VideoSchemaType} from '@/lib/schemas'
import { createremotionVideo } from "@/lib/videoActions"
import { BaseForm } from '@/components/VideoSeriesForm/BaseForm'
import { LoadingScreen } from '@/components/dashboard/LoadingScreen'
import { Suspense } from "react"

function CreateVideoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSeries, setIsSeries] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<VideoSchemaType>({
    resolver: zodResolver(VideoSchema),
    defaultValues: VideoSchema.parse({}),
    mode: "onChange",
  })

  useEffect(() => {
    const topic = searchParams.get('topic')
    if (topic) {
      form.setValue('topic', topic)
      onSubmit({ topic } as VideoSchemaType)
    }
  }, [searchParams])

  const onSubmit = async (data: VideoSchemaType) => {
    setIsLoading(true)
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value))
      }
    })
  
    const result = await createremotionVideo(formData)
    setIsLoading(false)
    if (result && result.id) {
      router.push(`/dashboard/videos/view/${result.id}`)
    }
  }

  return (
    <>
      <BaseForm
        form={form} 
        onSubmit={onSubmit} 
        isSeries={isSeries} 
        submitText={isSeries ? "CREATE SERIES" : "CREATE VIDEO"}
      />
      <LoadingScreen 
        isOpen={isLoading} 
        onOpenChange={setIsLoading}
      />
    </>
  )
}

export default function CreateVideoPage() {
  return (
    <Suspense fallback={<LoadingScreen isOpen={true} onOpenChange={() => {}} />}>
      <CreateVideoForm />
    </Suspense>
  )
}
