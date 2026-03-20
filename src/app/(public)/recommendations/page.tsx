"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Smile, 
  Frown, 
  Zap, 
  CloudRain, 
  Sun, 
  Brain, 
  Dumbbell, 
  Leaf, 
  Activity,
  ArrowRight,
  RefreshCw,
  Search
} from "lucide-react";
import AIRecCard from "@/components/shared/AIRecCard";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";

const moods = [
  { id: "stressed", label: "Stressed", icon: CloudRain, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "happy", label: "Happy", icon: Sun, iconColor: "text-amber-500", bg: "bg-amber-50" },
  { id: "tired", label: "Tired", icon: Frown, iconColor: "text-zinc-500", bg: "bg-zinc-100" },
  { id: "energetic", label: "Energetic", icon: Zap, iconColor: "text-yellow-500", bg: "bg-yellow-50" },
];

const healthGoals = [
  { id: "weight-loss", label: "Weight Loss", icon: Leaf },
  { id: "muscle-gain", label: "Muscle Gain", icon: Dumbbell },
  { id: "focus", label: "Mental Focus", icon: Brain },
  { id: "balanced", label: "Balanced", icon: Activity },
];

export default function RecommendationPage() {
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [summary, setSummary] = useState("");

  const getRecommendations = async () => {
    if (!selectedMood && !selectedGoal) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: selectedMood,
          healthGoal: selectedGoal,
        }),
      });

      const data = await response.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans">
      <PublicNavbar />
      
      <main className="max-w-6xl mx-auto px-6 py-20">
        <header className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-500 text-sm font-bold mb-6"
          >
            <Sparkles className="w-4 h-4" /> AI Personal Chef
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent"
          >
            Eat what you <br />
            <span className="text-indigo-500 italic">feel like.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-500 dark:text-zinc-400 text-lg max-w-2xl mx-auto"
          >
            Our AI analyzes your mood and health goals to find the perfect meal for your current state of being.
          </motion.p>
        </header>

        <section className="grid lg:grid-cols-12 gap-12 mb-20">
          <div className="lg:col-span-5 space-y-12">
            {/* Mood Selector */}
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Smile className="w-5 h-5 text-indigo-500" /> How are you feeling?
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {moods.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => setSelectedMood(mood.id)}
                    className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-300 ${
                      selectedMood === mood.id 
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 translate-y--1" 
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                    }`}
                  >
                    <mood.icon className={`w-10 h-10 mb-3 ${selectedMood === mood.id ? "text-indigo-500" : "text-zinc-400"}`} />
                    <span className="font-bold">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Selector */}
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-indigo-500" /> What's your goal?
              </h3>
              <div className="space-y-3">
                {healthGoals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                      selectedGoal === goal.id 
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10" 
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 bg-white dark:bg-zinc-900"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${selectedGoal === goal.id ? "bg-indigo-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                        <goal.icon className="w-5 h-5" />
                      </div>
                      <span className="font-bold">{goal.label}</span>
                    </div>
                    {selectedGoal === goal.id && <Zap className="w-4 h-4 text-indigo-500 fill-current" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={getRecommendations}
              disabled={isLoading || (!selectedMood && !selectedGoal)}
              className="w-full h-20 rounded-3xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" /> Cooking up ideas...
                </>
              ) : (
                <>
                  Generate Recommendations <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 min-h-[400px]">
            <AnimatePresence mode="wait">
              {recommendations.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  {summary && (
                    <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 mb-8">
                      <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                        "{summary}"
                      </p>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-6">
                    {recommendations.map((item, index) => (
                      <AIRecCard key={item._id} item={item} index={index} />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-12 text-center"
                >
                  <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                    <Search className="w-10 h-10 text-zinc-300" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Ready to explore?</h3>
                  <p className="text-zinc-500 max-w-xs">Select your mood and health goals on the left to get personalized recommendations.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
