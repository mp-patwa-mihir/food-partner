import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectDB } from "@/lib/db";
import MenuItem, { IMenuItem } from "@/models/MenuItem";
import Restaurant from "@/models/Restaurant";
import User, { IUser } from "@/models/User";
import Order from "@/models/Order";
import { getCurrentWeather } from "@/lib/weather";
import { headers } from "next/headers";
import { RecommendationEngine, ScoringContext } from "@/lib/recommendationEngine";
import { RecommendationGenerator } from "@/lib/recommendationGenerator";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { mood } = await request.json();

    await connectDB();

    // 1. Fetch User and Context
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    let user: IUser | null = null;
    let pastOrders: any[] = [];

    if (userId) {
      user = await User.findById(userId);
      pastOrders = await Order.find({ user: userId }).lean();
    }

    const weather = await getCurrentWeather();
    const context: ScoringContext = {
      mood: mood || "Neutral",
      weather: weather.condition,
      healthGoal: user?.healthGoals?.[0] || "Balanced Diet",
    };

    // 2. Fetch available menu items
    const approvedRestaurants = await Restaurant.find({ isApproved: true, isOpen: true }).select("_id");
    const restaurantIds = approvedRestaurants.map(r => r._id);

    const menuItems = await MenuItem.find({
      restaurant: { $in: restaurantIds },
      isAvailable: true,
    })
    .populate("restaurant", "name");

    if (menuItems.length === 0) {
      return NextResponse.json({ error: "No menu items available." }, { status: 404 });
    }

    // 3. Score Items using Recommendation Engine
    const scoredItems = RecommendationEngine.scoreItems(
      menuItems as any,
      user,
      pastOrders,
      context
    );

    // 4. Use Gemini for final reasoning on top 5 items
    const topItems = scoredItems.slice(0, 5);
    // 4. Generate Natural Language Message
    const generatedMessage = RecommendationGenerator.generateMessage(context, topItems as any);

    const timeOfDay = new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening";

    let finalPayload = {
      recommendations: topItems.map(item => ({
        ...item,
        aiReasoning: "Recommended based on your preferences and current context.",
        matchPercentage: Math.min(Math.floor((item.score / 50) * 100), 100)
      })),
      summary: generatedMessage
    };

    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are a food recommendation expert. For these top-scored dishes, provide a one-sentence reasoning and a match percentage (1-100).
        
        Context:
        Mood: ${context.mood}
        Weather: ${context.weather}
        Health Goal: ${context.healthGoal}

        Top Items:
        ${JSON.stringify(topItems.map(item => ({
          name: item.name,
          score: item.score,
          breakdown: item.scoringBreakdown,
          description: item.description
        })))}

        Return JSON format:
        {
          "recommendations": [
            { "name": "string", "reasoning": "string", "matchPercentage": number }
          ],
          "summary": "string"
        }
      `;

      try {
        const result = await model.generateContent(prompt);
        const aiResponse = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
        
        finalPayload.recommendations = topItems.map(item => {
          const aiRec = aiResponse.recommendations.find((r: any) => r.name === item.name);
          return {
            ...item,
            aiReasoning: aiRec?.reasoning || finalPayload.recommendations[0].aiReasoning,
            matchPercentage: aiRec?.matchPercentage || finalPayload.recommendations[0].matchPercentage
          };
        });
        finalPayload.summary = aiResponse.summary;
      } catch (aiErr) {
        console.error("Gemini Reasoning Error:", aiErr);
      }
    }

    return NextResponse.json(finalPayload);

  } catch (error) {
    console.error("Recommendation Route Error:", error);
    return NextResponse.json({ error: "Failed to fetch recommendations." }, { status: 500 });
  }
}
