"use client";
import { Badge } from "@/components/ui/badge";
import Image, { StaticImageData } from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import image1 from "@/public/bird_gif.gif";
import image2 from "@/public/bird_gif.gif";
import image3 from "@/public/bird_gif.gif";

interface StepProps {
  number: number;
  title: string;
  description: string;
  image: StaticImageData;
}

const steps: StepProps[] = [
  {
    number: 1,
    title: "Create",
    description:
      "Choose a topic for your faceless video. Select from our preset list or create a custom prompt. Our AI will begin crafting your first unique video immediately.",
    image: image1,
  },
  {
    number: 2,
    title: "Customize",
    description:
      "Review your AI-generated video before it's posted. Edit the script, title, or background music as needed. Each video is uniquely created for your series.",
    image: image2,
  },
  {
    number: 3,
    title: "Automate or Download",
    description:
      "Download the video (for free!) or edit your posting schedule, connect your channels, and let us handle the rest.",
    image: image3,
  },
];

export const Features = () => {
  return (
    <section id="video-creation-steps" className="space-y-12 max-w-7xl mx-auto px-4">
      <h2 className="text-3xl lg:text-4xl font-bold text-center mb-8">
        Create Videos in{" "}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Three Simple Steps
        </span>
      </h2>

      <div className="grid lg:grid-cols-3 gap-8">
        {steps.map(({ number, title, description, image }: StepProps) => (
          <Card key={title} className="flex flex-col">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  {number}
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
            <CardFooter className="pt-4 pb-6 flex justify-center">
            <Image
  src={image}
  alt={`Step ${number}: ${title}`}
  width={200}
  height={200}
  className="object-contain"
/>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};