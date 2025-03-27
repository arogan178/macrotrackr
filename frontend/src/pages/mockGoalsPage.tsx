import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Target,
  Check,
  ArrowRight,
  TrendingUp,
  Calendar,
  AlertCircle,
  Edit2,
  Sparkles,
  LineChart,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const Goals = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("current");

  // Mock data for goals
  const weightGoal = {
    current: 72.5,
    target: 68.0,
    progress: 60,
    startDate: "Jan 15, 2025",
    targetDate: "Apr 30, 2025",
  };

  const calorieGoal = {
    daily: 1830,
    current: 1200,
  };

  const macroGoals = {
    protein: { value: 78, unit: "g", current: 65 },
    carbs: { value: 160, unit: "g", current: 120 },
    fats: { value: 65, unit: "g", current: 52 },
  };

  const streakGoals = [
    {
      id: 1,
      name: "Logging streak",
      current: 7,
      target: 30,
      icon: Calendar,
      progress: 23,
    },
    {
      id: 2,
      name: "Macro goals hit",
      current: 5,
      target: 7,
      icon: Target,
      progress: 71,
    },
    {
      id: 3,
      name: "Weekly weigh-ins",
      current: 4,
      target: 4,
      icon: TrendingUp,
      progress: 100,
    },
  ];

  const achievedGoals = [
    { id: 1, name: "First 5-day streak", date: "Mar 12, 2025", icon: Calendar },
    {
      id: 2,
      name: "Hit protein goal 7 days in a row",
      date: "Mar 5, 2025",
      icon: Target,
    },
    {
      id: 3,
      name: "Lost first kilogram",
      date: "Feb 20, 2025",
      icon: TrendingUp,
    },
  ];

  const handleUpdateGoals = () => {
    toast({
      title: "Update Goals",
      description: "You can modify your fitness and nutrition goals here.",
    });
  };

  return (
    <div className="min-h-screen bg-health-background text-white">
      <Navbar />

      <main className="container mx-auto px-4 md:px-6 py-6">
        <div className="flex justify-between items-center mb-8">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-1">Your Goals</h1>
            <p className="text-white/60">
              Track your progress and stay motivated
            </p>
          </div>

          <Button
            className="bg-health-accent hover:bg-health-accent/90"
            onClick={handleUpdateGoals}
          >
            Update Goals <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-white/5 p-1 mb-6">
            <TabsTrigger
              value="current"
              className="data-[state=active]:bg-health-accent data-[state=active]:text-white"
            >
              Active Goals
            </TabsTrigger>
            <TabsTrigger
              value="achieved"
              className="data-[state=active]:bg-health-accent data-[state=active]:text-white"
            >
              Achieved Goals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Primary Goal Card */}
              <div className="health-card p-6 lg:col-span-2">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Weight Goal</h2>
                    <p className="text-white/60 text-sm">
                      Started {weightGoal.startDate} • Target date{" "}
                      {weightGoal.targetDate}
                    </p>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-full">
                    <Edit2 className="w-5 h-5 text-health-accent" />
                  </div>
                </div>

                <div className="flex justify-between items-end mb-6">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">
                        {weightGoal.current}
                      </span>
                      <span className="text-xl text-white/60">kg</span>
                      <span className="text-lg text-health-accent">→</span>
                      <span className="text-2xl font-medium">
                        {weightGoal.target}
                      </span>
                      <span className="text-white/60">kg</span>
                    </div>
                    <div className="text-white/60 text-sm mt-1">
                      {(weightGoal.current - weightGoal.target).toFixed(1)} kg
                      remaining to reach your goal
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-health-accent">
                      {weightGoal.progress}%
                    </div>
                    <div className="text-white/60 text-sm">
                      of goal completed
                    </div>
                  </div>
                </div>

                <Progress
                  value={weightGoal.progress}
                  className="h-2 bg-white/10 [&>div]:bg-health-accent"
                />

                <div className="mt-6 bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-4 flex gap-3">
                  <div className="flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-indigo-300 mb-1">
                      Goal Insight
                    </h3>
                    <p className="text-white/80 text-sm">
                      You're making steady progress! Your current rate of weight
                      loss is aligned with healthy recommendations. Keep it up!
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Calorie Goal */}
              <div className="health-card p-6">
                <h2 className="text-xl font-semibold mb-6 flex justify-between items-center">
                  <span>Daily Goals</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </h2>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <LineChart className="w-4 h-4 text-health-accent" />
                        <span className="font-medium">Calories</span>
                      </div>
                      <div className="text-sm text-white/60">
                        {Math.round(
                          (calorieGoal.current / calorieGoal.daily) * 100
                        )}
                        % of goal
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-2 text-2xl font-bold">
                      <span>{calorieGoal.current}</span>
                      <span className="text-white/40">/</span>
                      <span className="text-white/60">{calorieGoal.daily}</span>
                    </div>

                    <Progress
                      value={(calorieGoal.current / calorieGoal.daily) * 100}
                      className="h-2 bg-white/10 [&>div]:bg-health-accent"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white/5 p-3 rounded-lg">
                      <div className="flex justify-center mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-health-protein"></span>
                      </div>
                      <div className="text-sm mb-1">Protein</div>
                      <div className="text-lg font-semibold">
                        {macroGoals.protein.current}/{macroGoals.protein.value}g
                      </div>
                      <Progress
                        value={
                          (macroGoals.protein.current /
                            macroGoals.protein.value) *
                          100
                        }
                        className="h-1.5 mt-2 bg-white/10 [&>div]:bg-health-protein"
                      />
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <div className="flex justify-center mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-health-carbs"></span>
                      </div>
                      <div className="text-sm mb-1">Carbs</div>
                      <div className="text-lg font-semibold">
                        {macroGoals.carbs.current}/{macroGoals.carbs.value}g
                      </div>
                      <Progress
                        value={
                          (macroGoals.carbs.current / macroGoals.carbs.value) *
                          100
                        }
                        className="h-1.5 mt-2 bg-white/10 [&>div]:bg-health-carbs"
                      />
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <div className="flex justify-center mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-health-fats"></span>
                      </div>
                      <div className="text-sm mb-1">Fats</div>
                      <div className="text-lg font-semibold">
                        {macroGoals.fats.current}/{macroGoals.fats.value}g
                      </div>
                      <Progress
                        value={
                          (macroGoals.fats.current / macroGoals.fats.value) *
                          100
                        }
                        className="h-1.5 mt-2 bg-white/10 [&>div]:bg-health-fats"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Streak Goals */}
            <h2 className="text-xl font-semibold mb-4">Habit Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {streakGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="health-card p-5 hover:bg-health-cardHover transition-colors duration-300"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium">{goal.name}</h3>
                    <div className="bg-white/5 p-1.5 rounded-lg">
                      <goal.icon className="w-4 h-4 text-white/80" />
                    </div>
                  </div>

                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-2xl font-bold">{goal.current}</span>
                    <span className="text-white/60 text-sm">
                      / {goal.target}
                    </span>
                    <span className="ml-auto text-sm text-white/60">
                      {goal.progress === 100 ? (
                        <span className="text-green-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Complete
                        </span>
                      ) : (
                        `${goal.progress}%`
                      )}
                    </span>
                  </div>

                  <Progress
                    value={goal.progress}
                    className="h-1.5 bg-white/10 [&>div]:bg-health-accent"
                  />
                </div>
              ))}
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-200 mb-1">
                  Goals Review
                </h3>
                <p className="text-white/80 text-sm">
                  Your nutrition goals will be reviewed on April 15th. Make sure
                  to log your meals regularly for the most accurate
                  recommendations.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="achieved" className="animate-fade-in">
            <div className="health-card p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span>Achievements</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="bg-yellow-500/20 p-2 rounded-lg">
                        <goal.icon className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div className="text-xs text-white/60">{goal.date}</div>
                    </div>

                    <h3 className="font-medium text-lg mb-1">{goal.name}</h3>
                    <div className="text-white/60 text-sm">Completed goal</div>

                    <div className="mt-3 flex justify-end">
                      <div className="flex items-center gap-1 bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded-full">
                        <Check className="w-3 h-3" />
                        Achieved
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  View All Achievements
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Goals;
