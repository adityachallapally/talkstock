'use client'
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Plus, Minus } from "lucide-react";

enum PopularPlanType {
  NO = 0,
  YES = 1,
}

interface PricingProps {
  title: string;
  popular: PopularPlanType;
  basePrice: number;
  description: string;
  buttonText: string;
  benefitList: string[];
}
const pricingList: PricingProps[] = [
  {
    title: "FREE",
    popular: PopularPlanType.NO,
    basePrice: 0,
    description: "Best for hobbyists",
    buttonText: "CREATE VIDEO!",
    benefitList: [
      "Create 1 Video Per Day",
      "1 Series",
      "Edit & Preview Videos",
      "Auto-Post To Channel",
      "HD Video Resolution",
      "Background Music",
      "No Watermark",
    ],
  },
  {
    title: "STANDARD",
    popular: PopularPlanType.YES,
    basePrice: 2,
    description: "Ideal for growing creators",
    buttonText: "TRY NOW!",
    benefitList: [
      "20 Videos Per Month",
      "Choose: Auto-Create OR Auto-Post",
      "1 Series",
      "Edit & Preview Videos",
      "Auto-Post To Channel",
      "HD Video Resolution",
      "Background Music",
      "No Watermark",
    ],
  },
  {
    title: "ELITE",
    popular: PopularPlanType.NO,
    basePrice: 6,
    description: "Perfect for dedicated professionals",
    buttonText: "TRY NOW!",
    benefitList: [
      "40 Videos Per Month",
      "Auto-Create AND Auto-Post",
      "Multiple Series",
      "Edit & Preview Videos",
      "Auto-Post To Multiple Channels",
      "4K Video Resolution",
      "Custom Background Music",
      "No Watermark",
      "Priority Support",
    ],
  },
];

export const Pricing = () => {
  const [prices, setPrices] = useState({
    FREE: 0,
    STANDARD: 2,
    ELITE: 6
  });
  const [series, setSeries] = useState({
    FREE: 1,
    STANDARD: 1,
    ELITE: 1
  });
  const [postsPerDay, setPostsPerDay] = useState(1);

  const updateSeries = (plan: string, increment: boolean) => {
    setSeries(prev => ({
      ...prev,
      [plan]: Math.max(1, prev[plan] + (increment ? 1 : -1))
    }));
    setPrices(prev => ({
      ...prev,
      [plan]: Math.max(plan === 'STANDARD' ? 2 : 6, prev[plan] + (increment ? (plan === 'STANDARD' ? 2 : 6) : -(plan === 'STANDARD' ? 2 : 6)))
    }));
  };

  const updatePostsPerDay = (increment: boolean) => {
    setPostsPerDay(prev => Math.max(1, prev + (increment ? 1 : -1)));
    setPrices(prev => ({
      ...prev,
      ELITE: 6 * postsPerDay * series.ELITE
    }));
  };

  return (
    <section id="pricing" className="space-y-12">
      <h2 className="text-3xl md:text-4xl font-bold text-center">
        Get
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          {" "}
          Unlimited{" "}
        </span>
        Access
      </h2>
      <h3 className="text-xl text-center text-muted-foreground pt-4 pb-8">
        Choose the plan that is right for you
      </h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pricingList.map((pricing: PricingProps) => (
          <Card
            key={pricing.title}
            className={
              pricing.popular === PopularPlanType.YES
                ? "drop-shadow-xl shadow-black/10 dark:shadow-white/10"
                : ""
            }
          >
            <CardHeader>
              <CardTitle className="flex item-center justify-between">
                {pricing.title}
                {pricing.popular === PopularPlanType.YES ? (
                  <Badge variant="secondary" className="text-sm text-primary">
                    Most popular
                  </Badge>
                ) : null}
              </CardTitle>
              <div>
                <span className="text-3xl font-bold">
                  ${prices[pricing.title as keyof typeof prices]}
                </span>
                <span className="text-muted-foreground"> /month</span>
              </div>

              <CardDescription>{pricing.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <Button className="w-full">{pricing.buttonText}</Button>
            </CardContent>

            <hr className="w-4/5 m-auto mb-4" />

            <CardFooter className="flex">
              <div className="space-y-4">
                {pricing.benefitList.map((benefit: string, index: number) => (
                  <span
                    key={benefit}
                    className={`flex items-center ${
                      pricing.title === "FREE" && index > 2 ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    <Check 
                      className={
                        pricing.title === "FREE" && index > 2 
                          ? "text-muted-foreground" 
                          : "text-green-500"
                      } 
                    />
                    <h3 className="ml-2">
                      {benefit === "1 Series" ? `${series[pricing.title as keyof typeof series]} Series` : 
                       (pricing.title === "ELITE" && benefit === "Posts Once A Day") ? `Posts ${postsPerDay} Time${postsPerDay > 1 ? 's' : ''} A Day` :
                       benefit}
                    </h3>
                    {(pricing.title === "STANDARD" || pricing.title === "ELITE") && benefit === "1 Series" && (
                      <>
                        <Plus className="ml-1 h-4 w-4 cursor-pointer" onClick={() => updateSeries(pricing.title, true)} />
                        <Minus className="ml-1 h-4 w-4 cursor-pointer" onClick={() => updateSeries(pricing.title, false)} />
                      </>
                    )}
                    {pricing.title === "ELITE" && benefit === "Posts Once A Day" && (
                      <>
                        <Plus className="ml-1 h-4 w-4 cursor-pointer" onClick={() => updatePostsPerDay(true)} />
                        <Minus className="ml-1 h-4 w-4 cursor-pointer" onClick={() => updatePostsPerDay(false)} />
                      </>
                    )}
                  </span>
                ))}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};