import { IMenuItem } from "@/models/MenuItem";
import { IUser } from "@/models/User";
import { IOrder } from "@/models/Order";

export interface ScoringContext {
  mood?: string;
  weather?: string;
  healthGoal?: string;
  dietPreference?: string;
}

export class RecommendationEngine {
  private static readonly WEIGHTS = {
    MOOD_MATCH: 10,
    WEATHER_MATCH: 10,
    DIET_MATCH: 20,
    HEALTH_GOAL_MATCH: 15,
    CUISINE_MATCH: 15,
    PAST_ORDER_BOOST: 5,
    SPECIAL_BOOST: 20,
  };

  /**
   * Scores a list of menu items based on user context, preferences, and order history.
   */
  public static scoreItems(
    items: IMenuItem[],
    user: IUser | null,
    pastOrders: IOrder[],
    context: ScoringContext
  ): (IMenuItem & { score: number; scoringBreakdown: string[] })[] {
    const scoredItems = items.map((item) => {
      let score = 0;
      const breakdown: string[] = [];

      // 1. Mood Match
      if (context.mood && item.moodTags?.some(tag => tag.toLowerCase() === context.mood?.toLowerCase())) {
        score += this.WEIGHTS.MOOD_MATCH;
        breakdown.push(`Mood match: +${this.WEIGHTS.MOOD_MATCH}`);
      }

      // 2. Weather Match
      if (context.weather && item.weatherTags?.some(tag => tag.toLowerCase() === context.weather?.toLowerCase())) {
        score += this.WEIGHTS.WEATHER_MATCH;
        breakdown.push(`Weather match: +${this.WEIGHTS.WEATHER_MATCH}`);
      }

      // 3. User Preferences and Contextual Preferences
      
      // Diet Match (from user profile or context)
      const userDietPrefs = user?.dietaryPreferences || [];
      const contextDietPref = context.dietPreference;
      if (userDietPrefs.some(pref => item.dietTags?.includes(pref)) || 
          (contextDietPref && item.dietTags?.includes(contextDietPref))) {
        score += this.WEIGHTS.DIET_MATCH;
        breakdown.push(`Diet preference match: +${this.WEIGHTS.DIET_MATCH}`);
      }

      // Health Goal Match (from user profile or context)
      const userHealthGoals = user?.healthGoals || [];
      const contextHealthGoal = context.healthGoal;
      if (userHealthGoals.some(goal => item.healthTags?.includes(goal)) ||
          (contextHealthGoal && item.healthTags?.includes(contextHealthGoal))) {
        score += this.WEIGHTS.HEALTH_GOAL_MATCH;
        breakdown.push(`Health goal match: +${this.WEIGHTS.HEALTH_GOAL_MATCH}`);
      }

      // Keyword matching (name/description) for mood, healthGoal, dietPreference
      [context.mood, context.healthGoal, context.dietPreference].forEach(ctxParam => {
        if (ctxParam) {
           const lowerParam = ctxParam.toLowerCase();
           const inName = item.name.toLowerCase().includes(lowerParam);
           const inDesc = item.description?.toLowerCase().includes(lowerParam);
           if (inName || inDesc) {
              score += this.WEIGHTS.SPECIAL_BOOST;
              breakdown.push(`Keyword match for '${ctxParam}': +${this.WEIGHTS.SPECIAL_BOOST}`);
           }
        }
      });

      // Cuisine Match (from user profile)
      if (user && item.cuisine && user.cuisinePreferences?.includes(item.cuisine)) {
        score += this.WEIGHTS.CUISINE_MATCH;
        breakdown.push(`Cuisine preference match: +${this.WEIGHTS.CUISINE_MATCH}`);
      }

      // 4. Past Order Similarity
      const orderCount = pastOrders.reduce((count, order) => {
        return count + order.items.filter(orderItem => orderItem.menuItemId.toString() === item._id.toString()).length;
      }, 0);

      if (orderCount > 0) {
        const orderBoost = Math.min(orderCount * this.WEIGHTS.PAST_ORDER_BOOST, 20);
        score += orderBoost;
        breakdown.push(`Past order similarity: +${orderBoost}`);
      }

      // 5. Special Logic Boosts
      this.applySpecialBoosts(item, context, (points, reason) => {
        score += points;
        breakdown.push(`${reason}: +${points}`);
      });

      return {
        ...item.toObject ? item.toObject() : item,
        score,
        scoringBreakdown: breakdown,
      };
    });

    return scoredItems.sort((a, b) => b.score - a.score);
  }

  private static applySpecialBoosts(
    item: IMenuItem,
    context: ScoringContext,
    addPoints: (points: number, reason: string) => void
  ) {
    // Weather: Rain -> soup, tea, noodles
    if (context.weather?.toLowerCase() === "rainy" || context.weather?.toLowerCase() === "rain") {
      const rainyItems = ["soup", "tea", "noodles", "chai"];
      if (rainyItems.some(keyword => item.name.toLowerCase().includes(keyword) || item.description?.toLowerCase().includes(keyword))) {
        addPoints(this.WEIGHTS.SPECIAL_BOOST, "Rainy day comfort");
      }
    }

    // Health Goal: Weight Loss -> low calorie
    if (context.healthGoal?.toLowerCase() === "weightloss" || context.healthGoal?.toLowerCase() === "weight-loss") {
      if (item.healthTags?.includes("low-calorie") || (item.healthMetrics?.calories && item.healthMetrics.calories < 400)) {
        addPoints(this.WEIGHTS.SPECIAL_BOOST, "Weight loss alignment");
      }
    }

    // Mood: Late Night -> snacks and fast food
    if (context.mood?.toLowerCase() === "late-night" || context.mood?.toLowerCase() === "latenight") {
      const lateNightTags = ["snack", "fast-food", "munchies"];
      if (lateNightTags.some(tag => item.category?.toString().toLowerCase().includes(tag) || item.moodTags?.includes(tag))) {
        addPoints(this.WEIGHTS.SPECIAL_BOOST, "Late night cravings");
      }
    }
  }
}
