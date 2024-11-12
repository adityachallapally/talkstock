import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    title: "Choose your topic",
    description: "Select a subject that you're passionate about and want to explore in depth.",
    icon: "📚"
  },
  {
    title: "Plan your episodes",
    description: "Outline the key points and structure for each episode in your series.",
    icon: "✏️"
  },
  {
    title: "Start creating",
    description: "Begin producing your content, whether it's writing, recording, or filming.",
    icon: "🎬"
  }
];

export default function SeriesSteps() {
    return (
      <div className="bg-white text-black">
        <h1 className="text-4xl font-bold text-center mb-8">
          3 Easy Steps to Create a Series
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="bg-[#1e293b] border-0">
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <span className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center mr-3 text-base font-bold">
                    {index + 1}
                  </span>
                  <h2 className="text-lg text-white font-semibold">{step.title}</h2>
                </div>
                <p className="text-gray-400 text-sm mb-3">{step.description}</p>
                <div className="text-3xl">{step.icon}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }