import Image from 'next/image'
import React from 'react'

interface TrendingTopicsProps {
  onTopicSelect: (topic: string) => void;
}

const TrendingTopics: React.FC<TrendingTopicsProps> = ({ onTopicSelect }) => {
  const trendingTopics = [
    "Olympics",
    "US Elections",
    "Middle East Conflict",
    "Generative AI",
  ];

  return (
    <div className="flex flex-col items-center mt-12 text-sm mb-24">
      <div className="font-semibold mb-4 text-lg flex items-center flex-wrap justify-center space-x-2">
        <span>Trending 🚀 Topics on</span>
        <div className="flex items-center space-x-2">
          <Image
            src="/icons/youtube.svg"
            alt="YouTube"
            width={24}
            height={24}
          />
          <Image 
            src="/icons/tiktok.svg" 
            alt="TikTok" 
            width={24} 
            height={24} 
          />
          <Image 
            src="/icons/reddit.svg" 
            alt="Reddit"
            width={24}
            height={24}
          />
          <Image
            src="/icons/instagram.svg"
            alt="Instagram"
            width={24}
            height={24}
          />
        </div>
        <span>for the week of:</span>
        <span>
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>
      <div className="flex flex-wrap justify-center items-center space-x-4 bg-gray-100 p-3 rounded-lg shadow-md">
        {trendingTopics.map((topic, index) => (
          <span
            key={index}
            className="border rounded-full px-3 py-1 text-gray-700 hover:bg-gray-200 transition-colors duration-200 mb-2 cursor-pointer"
            onClick={() => onTopicSelect(topic)}
          >
            {topic}
          </span>
        ))}
      </div>
    </div>
  )
}

export default TrendingTopics