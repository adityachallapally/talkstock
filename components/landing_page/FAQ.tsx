'use client'
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}
const FAQList: FAQProps[] = [
  {
    question: "What exactly is a Series?",
    answer: "A Series is essentially your AI video-making playbook. It's a set of instructions that guides our AI in creating and posting videos automatically. You specify the topic, posting schedule, and target social media accounts, and our system takes care of the rest. For instance, you could set up a 'Spooky Tales' series that generates and posts content to TikTok and YouTube daily at 9PM EST.",
    value: "item-1",
  },
  {
    question: "Is there a limit on the types of videos I can create?",
    answer: "Not at all! Our platform is designed to accommodate a wide range of topics and niches. Feel free to select from our curated list or craft your own custom prompt to explore any subject that interests you.",
    value: "item-2",
  },
  {
    question: "Which social media platforms can I post to?",
    answer: "At present, we've integrated with TikTok and YouTube for seamless posting. We're actively working on expanding our platform support to give you even more options in the future.",
    value: "item-3",
  },
  {
    question: "How unique are the generated videos?",
    answer: "Each video is a fresh creation, thanks to our advanced generative AI. Unlike services that recycle content, our system ensures that every video—even those on similar topics—features distinct scripts and visuals. This approach guarantees a unique viewing experience every time.",
    value: "item-4",
  },
  {
    question: "Can I make changes to the videos?",
    answer: "Absolutely. You have the flexibility to fine-tune elements like the script, title, and background music right up until the scheduled posting time.",
    value: "item-5",
  },
  {
    question: "How do I use custom prompts effectively?",
    answer: "Custom prompts are your creative steering wheel. For example, if you input 'Share an intriguing fact about Genghis Khan', our AI will generate a series of videos, each highlighting different aspects of the topic. This ensures variety while staying true to your chosen theme.",
    value: "item-6",
  },
  {
    question: "What's the daily video creation limit?",
    answer: "The number of videos you can create daily depends on your chosen plan. Check out our pricing page for detailed information on video limits for each tier.",
    value: "item-7",
  },
  {
    question: "Is it possible to start over with a new series?",
    answer: "Of course! You have the freedom to delete any existing series and start afresh with new topics or settings up to 10 times per day. Keep in mind, our free plan allows for one active series per account.",
    value: "item-8",
  },
  {
    question: "Can I control the length of my videos?",
    answer: "Definitely. When setting up your series, you can opt for 30-second, 60-second, or 90-second durations. For more precise control, you can manually adjust your AI-generated script, with a maximum limit of 1,600 characters.",
    value: "item-9",
  },
  {
    question: "Who retains ownership of the created videos?",
    answer: "You do! Once created, the videos are entirely yours. Feel free to download them, share them on various platforms, or even monetize them by selling to clients.",
    value: "item-10",
  },
  {
    question: "Do you offer a trial period?",
    answer: "Absolutely! We believe in letting you experience our service firsthand. Simply sign up for an account, and you can create your first series at no cost, with no credit card required.",
    value: "item-11",
  },
  {
    question: "Is cancellation hassle-free?",
    answer: "100%. We despise complicated cancellation processes as much as you do. Cancelling your subscription is as simple as clicking a button on your dashboard's billing page.",
    value: "item-12",
  },
  {
    question: "Could you explain how the membership tiers work?",
    answer: "We offer a range of memberships to suit different needs. While our free plan gets you started, our paid tiers come with perks like watermark removal and increased posting frequency.",
    value: "item-13",
  },
  {
    question: "What's your refund policy?",
    answer: "Due to the high costs associated with AI video creation and image generation, we're unable to offer refunds. However, you're free to cancel your subscription at any time, which will take effect at the end of your current billing cycle.",
    value: "item-14",
  },
];

const FAQ: React.FC = () => {
  return (
    <section id="faq" className="space-y-12">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        Frequently Asked{" "}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Questions
        </span>
      </h2>

      <Accordion type="single" collapsible className="w-full AccordionRoot">
        {FAQList.map(({ question, answer, value }: FAQProps) => (
          <AccordionItem key={value} value={value}>
            <AccordionTrigger className="text-left">
              {question}
            </AccordionTrigger>

            <AccordionContent>{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <h3 className="font-medium mt-4">
        Still have questions?{" "}
        <Link
          href="/contact"  // Replace with your actual contact page path
          className="text-primary transition-all border-primary hover:border-b-2"
        >
          Contact us
        </Link>
      </h3>
    </section>
  );
};

export default FAQ;