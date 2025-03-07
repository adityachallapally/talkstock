'use client'

import { useState } from "react";
import Header from "@/components/header";
import Hero from "@/components/landing_page/Hero";
import TrendingTopics from "@/components/landing_page/TrendingTopics";
import InfiniteCarousel from "@/components/landing_page/InfiniteCarousel";
import { Features } from "@/components/landing_page/Features";
import { Pricing } from "@/components/landing_page/Pricing";
import FAQ from "@/components/landing_page/FAQ";
import { Footer } from "@/components/footer";
import VideoCounter from "@/components/landing_page/VideoCounter";

const gifs = [
  { id: "1", src: "/flowers.jpg" },
  { id: "2", src: "/flowers.jpg" },
  { id: "3", src: "/flowers.jpg" },
  { id: "4", src: "/flowers.jpg" },
  { id: "5", src: "/flowers.jpg" },
  { id: "6", src: "/flowers.jpg" },
  { id: "7", src: "/flowers.jpg" },
  { id: "8", src: "/flowers.jpg" },
  { id: "9", src: "/flowers.jpg" },
  { id: "10", src: "/flowers.jpg" },
  { id: "11", src: "/flowers.jpg" },
];

export default function Home() {
  const [selectedTopic, setSelectedTopic] = useState("");

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 space-y-24 py-12">
        <Hero selectedTopic={selectedTopic} />
        TalkStock
        <TrendingTopics onTopicSelect={handleTopicSelect} />
        {/* <InfiniteCarousel gifs={gifs} /> */}
        <Features />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}