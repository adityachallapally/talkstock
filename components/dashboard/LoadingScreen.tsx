import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Check } from "lucide-react"

interface LoadingScreenProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const stages = [
  { name: "Creating script", time: 60 },
  { name: "Creating audio", time: 120 },
  { name: "Creating images", time: 180 },
  { name: "Creating video", time: 480 },
  { name: "Polishing it all", time: 540 },
]

export function LoadingScreen({ isOpen, onOpenChange }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    let startTime: number

    if (isOpen) {
      startTime = Date.now()
      interval = setInterval(() => {
        const elapsedTime = Date.now() - startTime
        const newProgress = Math.min((elapsedTime / 120000) * 100, 100) // 120000ms = 2 minutes
        setProgress(newProgress)

        // Update current stage
        const newStage = stages.findIndex(stage => elapsedTime < stage.time * 1000 / 5) // Adjust stage times
        setCurrentStage(newStage === -1 ? stages.length - 1 : newStage)

        if (newProgress >= 100) {
          clearInterval(interval)
        }
      }, 1000) // Update every second
    }

    return () => clearInterval(interval)
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Creating Your Video</h2>
          <p className="text-sm text-gray-500 mb-4">This may take up to 2 minutes. Please do not close this window.</p>
          <Progress value={progress} className="w-full mb-4" />
          <p className="text-sm font-medium mb-4">{Math.round(progress)}% Complete</p>
          <ul className="text-left">
            {stages.map((stage, index) => (
              <li key={index} className="flex items-center mb-2">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  {index < currentStage ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : index === currentStage ? (
                    <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-gray-300" />
                  )}
                </div>
                <span className={`ml-2 ${index <= currentStage ? "font-medium" : "text-gray-500"}`}>
                  {stage.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}