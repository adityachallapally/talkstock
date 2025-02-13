'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VideoSchema, VideoSchemaType } from '@/lib/schemas' 
import { createremotionVideo } from "@/lib/videoActions" 
import Image from 'next/image'
import VideoCounter from '@/components/landing_page/VideoCounter'
import { UploadVideoPopup } from '@/components/landing_page/UploadVideoPopup'

const exampleTopics = [
  "How do trees grow?",
  "What happened to the Roman Empire?",
  "Why is yoga so good for you?",
  // ... (rest of the topics)
  "Why do we have seasons?"
]

const getRandomTopic = () => {
  const randomIndex = Math.floor(Math.random() * exampleTopics.length)
  return exampleTopics[randomIndex]
}

interface HeroProps {
  selectedTopic: string;
}

const Hero: React.FC<HeroProps> = ({ selectedTopic }) => {
  const [shadowActive, setShadowActive] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const router = useRouter()

  const form = useForm<VideoSchemaType>({
    resolver: zodResolver(VideoSchema),
    defaultValues: VideoSchema.parse({ topic: getRandomTopic() }),
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setShadowActive((prev) => !prev)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const shadowClass = shadowActive
    ? "shadow-[0_0_30px_rgba(0,0,0,0.1)]"
    : "shadow-[0_0_15px_rgba(0,0,0,0.05)]"

  useEffect(() => {
    if (selectedTopic) {
      form.setValue('topic', selectedTopic);
    }
  }, [selectedTopic, form]);

  const onSubmit = async (data: VideoSchemaType) => {
    router.push(`/dashboard/videos/create?topic=${encodeURIComponent(data.topic)}`)
  }

  return (
    <div className="relative flex justify-between items-center mb-24 pl-8">
      <div className="w-3/5 pr-8 flex flex-col h-full">
        <div className="mb-4">
          <VideoCounter />
        </div>
        <div>
          <h1 className="text-6xl font-bold mb-4 text-left">
            AI Text to Video
          </h1>
          <p className="text-xl text-gray-600 mb-8 text-left">
            Create videos with AI in minutes. Choose from a variety of voices, stock footage, background music, and
            more. No need to sign up!
          </p>
          <div className="flex items-center space-x-2 mb-8">
            <div
              className={`${shadowClass} rounded-full transition-shadow duration-300 flex w-full max-w-xl`}
            >
              <Input
                {...form.register('topic')}
                placeholder="What is your video topic?"
                className="rounded-l-full border-r-0 flex-grow"
              />
              <Button
                variant="ghost"
                className="rounded-r-full border-l whitespace-nowrap"
                onClick={() => form.setValue('topic', getRandomTopic())}
              >
                + New example
              </Button>
            </div>
            <Button
              className={`${shadowClass} rounded-full transition-shadow duration-300 whitespace-nowrap`}
              onClick={form.handleSubmit(onSubmit)}
            >
              Generate video
            </Button>
            <Button
              className={`${shadowClass} rounded-full transition-shadow duration-300 whitespace-nowrap`}
              variant="outline"
              onClick={() => setIsUploadOpen(true)}
            >
              Upload video
            </Button>
          </div>
        </div>
      </div>
      <div className="w-2/5">
        <div className="aspect-w-9 aspect-h-16 rounded-lg overflow-hidden">
          <img
            src="/bird_gif.gif"
            alt="Bird GIF"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <UploadVideoPopup 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  )
}

export default Hero