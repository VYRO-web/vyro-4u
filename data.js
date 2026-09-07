/* ============================================================
   VYRO — CONTENT LAYER
   In production this array is replaced by API calls to a real
   database/CMS (see ADMIN-NOTES.md). Every page reads from this
   single source so the admin dashboard, once built, only has to
   write to one place.
   ============================================================ */

const VYRO_CATEGORIES = [
  {
    slug: "fitness",
    name: "Fitness",
    tagline: "Workouts, training programs, challenges and fitness guides.",
    sub: ["Calisthenics", "Home Workouts", "Workout Programs", "Challenges", "Mobility"]
  },
  {
    slug: "food-nutrition",
    name: "Food & Nutrition",
    tagline: "Recipes, meal plans, healthy food guides and nutrition resources.",
    sub: ["Recipes", "Meal Plans", "High Protein", "Healthy Eating", "Smoothies"]
  },
  {
    slug: "style",
    name: "Style",
    tagline: "Outfit guides, wardrobe ideas, styling resources and visual inspiration.",
    sub: ["Men's Style", "Women's Style", "Outfit Guides", "Wardrobe", "Seasonal Style"]
  },
  {
    slug: "self-improvement",
    name: "Self-Improvement",
    tagline: "Habits, productivity, routines, personal development and lifestyle systems.",
    sub: ["Productivity", "Habits", "Routines", "Study", "Personal Growth"]
  }
];

const VYRO_PRODUCTS = [
  {
    id: "calisthenics-8week",
    name: "The 8-Week Calisthenics Starter System",
    category: "fitness",
    subcategory: "Calisthenics",
    price: 24,
    oldPrice: 34,
    rating: 4.8,
    reviewCount: 156,
    pages: 62,
    format: "PDF + printable tracker",
    featured: true,
    bestseller: true,
    isNew: false,
    dateAdded: "2026-04-02",
    shortDesc: "A structured 8-week bodyweight program built for true beginners.",
    overview: "The 8-Week Calisthenics Starter System takes you from zero training background to your first strict pull-up and a controlled push-up sequence, using nothing but your own bodyweight. Each week builds on the last with a clear progression system, so you always know exactly what to do and why.",
    whoFor: "Beginners with little or no training experience who want a simple, no-equipment plan they can follow at home or outdoors.",
    included: [
      "8-week structured training calendar",
      "Beginner exercise library with form breakdowns",
      "Progression system for pull-ups, push-ups and squats",
      "Weekly schedule with rest-day guidance",
      "Printable progress tracker",
      "Warm-up routine",
      "Recovery and mobility guide",
      "Nutrition basics for training days"
    ],
    learn: [
      "How to build strength without a gym",
      "How to progress an exercise safely",
      "How to structure a training week",
      "How to eat around your workouts"
    ],
    gallery: 4,
    reviews: [
      { name: "Marcus D.", rating: 5, text: "Followed this exactly as written and hit my first pull-up in week 6. The progressions actually make sense." },
      { name: "Priya K.", rating: 5, text: "Clear, no fluff, and the tracker keeps me honest. Best beginner program I've bought." },
      { name: "Tom R.", rating: 4, text: "Solid plan. Would like a couple more mobility drills but overall very well put together." }
    ]
  },
  {
    id: "high-protein-50",
    name: "50 High-Protein Recipes",
    category: "food-nutrition",
    subcategory: "High Protein",
    price: 19,
    oldPrice: null,
    rating: 4.6,
    reviewCount: 98,
    pages: 80,
    format: "PDF cookbook",
    featured: true,
    bestseller: false,
    isNew: true,
    dateAdded: "2026-07-18",
    shortDesc: "50 simple, high-protein meals with full macros for every recipe.",
    overview: "Fifty recipes built around one goal: hitting your protein target without eating the same three meals on repeat. Every recipe lists calories, protein, prep time and difficulty, so you can plan a full week in minutes.",
    whoFor: "Anyone training regularly who wants realistic, tasty meals that support their goals without complicated cooking.",
    included: [
      "50 recipes across breakfast, lunch, dinner and snacks",
      "Full macros and calories per recipe",
      "Prep time and difficulty rating",
      "Ingredient swap suggestions",
      "Printable shopping list template"
    ],
    learn: [
      "How to hit your protein target consistently",
      "How to batch-cook for the week",
      "How to swap ingredients without losing macros"
    ],
    gallery: 5,
    reviews: [
      { name: "Sofia L.", rating: 5, text: "The macros being listed for every single recipe is such a small thing that saves so much time." },
      { name: "James O.", rating: 4, text: "Great variety. A few recipes need ingredients that aren't always easy to find locally." }
    ]
  },
  {
    id: "mens-style-guide",
    name: "The Ultimate Men's Style Guide",
    category: "style",
    subcategory: "Men's Style",
    price: 22,
    oldPrice: 29,
    rating: 4.7,
    reviewCount: 203,
    pages: 54,
    format: "PDF guide",
    featured: true,
    bestseller: true,
    isNew: false,
    dateAdded: "2026-02-10",
    shortDesc: "Build a wardrobe that actually works together, for every occasion.",
    overview: "A practical guide to dressing well without overthinking it — colour combinations that always work, outfit formulas for casual, smart-casual and formal settings, and the essential pieces worth owning before anything else.",
    whoFor: "Anyone who wants to look put-together without spending hours second-guessing outfits.",
    included: [
      "40+ outfit examples with breakdowns",
      "Colour combination reference sheets",
      "Casual, smart-casual and formal outfit formulas",
      "Seasonal outfit adjustments",
      "Wardrobe essentials checklist"
    ],
    learn: [
      "How to combine colours with confidence",
      "How to build outfits around a few core pieces",
      "How to dress for formal vs casual settings"
    ],
    gallery: 6,
    reviews: [
      { name: "Daniel P.", rating: 5, text: "Genuinely changed how I shop. I buy fewer things now and they all go together." },
      { name: "Ola B.", rating: 5, text: "The colour reference sheets alone were worth it." }
    ]
  },
  {
    id: "habit-reset",
    name: "The Habit Reset Blueprint",
    category: "self-improvement",
    subcategory: "Habits",
    price: 18,
    oldPrice: null,
    rating: 4.5,
    reviewCount: 74,
    pages: 40,
    format: "PDF workbook",
    featured: true,
    bestseller: false,
    isNew: true,
    dateAdded: "2026-08-01",
    shortDesc: "A 21-day framework for replacing bad habits with ones that stick.",
    overview: "A short, focused workbook for identifying the habits that are actually holding you back, and replacing them with a system you can sustain — not a 6am-cold-shower routine you'll quit in a week.",
    whoFor: "Anyone who has tried to build better habits before and wants something more realistic this time.",
    included: [
      "21-day habit reset framework",
      "Habit-stacking worksheets",
      "Trigger and environment audit",
      "Weekly review template",
      "Relapse-recovery guide"
    ],
    learn: [
      "How to identify what's actually driving a bad habit",
      "How to design habits that survive a bad week",
      "How to track progress without obsessing over streaks"
    ],
    gallery: 3,
    reviews: [
      { name: "Amelia S.", rating: 5, text: "Less preachy than most habit guides. Feels like a workbook, not a lecture." },
      { name: "Kwame T.", rating: 4, text: "Good structure. I'd have liked a printable wall version of the tracker." }
    ]
  },
  {
    id: "home-workout-30",
    name: "30-Day Home Workout Challenge",
    category: "fitness",
    subcategory: "Challenges",
    price: 16,
    oldPrice: 22,
    rating: 4.6,
    reviewCount: 120,
    pages: 36,
    format: "PDF + calendar",
    featured: false,
    bestseller: true,
    isNew: false,
    dateAdded: "2026-03-15",
    shortDesc: "30 short, no-equipment workouts you can do anywhere.",
    overview: "Thirty daily workouts, 20–30 minutes each, designed to fit around a busy schedule with zero equipment required. A visual calendar keeps you on track from day one to day thirty.",
    whoFor: "People who want a short, no-excuses routine they can start today.",
    included: [
      "30 daily workout sessions",
      "Visual progress calendar",
      "Warm-up and cool-down routine",
      "Modifications for different fitness levels"
    ],
    learn: [
      "How to stay consistent for 30 days straight",
      "How to modify workouts to your level",
      "How to keep progressing after day 30"
    ],
    gallery: 3,
    reviews: [
      { name: "Nadia F.", rating: 5, text: "Finished all 30 days, first time I've ever completed a challenge like this." }
    ]
  },
  {
    id: "meal-prep-system",
    name: "The Weekly Meal Prep System",
    category: "food-nutrition",
    subcategory: "Meal Plans",
    price: 21,
    oldPrice: null,
    rating: 4.4,
    reviewCount: 61,
    pages: 48,
    format: "PDF + templates",
    featured: false,
    bestseller: false,
    isNew: true,
    dateAdded: "2026-08-20",
    shortDesc: "Plan, shop and prep a full week of meals in under two hours.",
    overview: "A repeatable system for planning, shopping and prepping a full week of food in one sitting, with four rotating meal templates so you never get bored.",
    whoFor: "Anyone tired of deciding what to eat every single day.",
    included: [
      "4 rotating weekly meal templates",
      "Printable shopping list generator",
      "Batch-cooking timeline",
      "Storage and reheating guide"
    ],
    learn: [
      "How to plan a week of meals in 20 minutes",
      "How to batch-cook efficiently",
      "How to keep prepped meals fresh longer"
    ],
    gallery: 4,
    reviews: [
      { name: "Ben C.", rating: 4, text: "Solid system, saved me a lot of decision fatigue during the week." }
    ]
  },
  {
    id: "womens-style-capsule",
    name: "The Capsule Wardrobe Guide",
    category: "style",
    subcategory: "Wardrobe",
    price: 20,
    oldPrice: null,
    rating: 4.7,
    reviewCount: 89,
    pages: 44,
    format: "PDF guide",
    featured: false,
    bestseller: false,
    isNew: false,
    dateAdded: "2026-01-22",
    shortDesc: "Build a versatile wardrobe from a small set of core pieces.",
    overview: "A step-by-step approach to building a capsule wardrobe: which pieces to keep, which to let go of, and how to mix a small collection of clothing into dozens of outfits.",
    whoFor: "Anyone who wants a simpler, more versatile wardrobe without buying constantly.",
    included: [
      "Core capsule piece checklist",
      "Seasonal transition guide",
      "Outfit combination map",
      "Closet audit worksheet"
    ],
    learn: [
      "How to choose versatile core pieces",
      "How to transition a capsule between seasons",
      "How to audit and simplify an existing wardrobe"
    ],
    gallery: 4,
    reviews: [
      { name: "Harper W.", rating: 5, text: "Cut my closet in half and somehow have more outfit options now." }
    ]
  },
  {
    id: "deep-work-system",
    name: "The Deep Work Productivity System",
    category: "self-improvement",
    subcategory: "Productivity",
    price: 23,
    oldPrice: 27,
    rating: 4.8,
    reviewCount: 142,
    pages: 52,
    format: "PDF + planner",
    featured: false,
    bestseller: true,
    isNew: false,
    dateAdded: "2026-05-05",
    shortDesc: "A weekly planning system built around real, focused work.",
    overview: "A practical system for structuring your week around deep, focused work instead of a constant stream of small tasks — including a weekly planner template you can reuse indefinitely.",
    whoFor: "Anyone who feels busy all day but rarely finishes meaningful work.",
    included: [
      "Weekly deep-work planning template",
      "Task-batching framework",
      "Distraction audit worksheet",
      "Focus-session tracker"
    ],
    learn: [
      "How to protect blocks of focused time",
      "How to batch shallow tasks",
      "How to audit and remove daily distractions"
    ],
    gallery: 3,
    reviews: [
      { name: "Grace M.", rating: 5, text: "The weekly template is the only planning system I've stuck with longer than a month." }
    ]
  }
];

function vyroFormatPrice(n) {
  return "$" + n.toFixed(2).replace(/\.00$/, "");
}

function vyroGetCategory(slug) {
  return VYRO_CATEGORIES.find(function (c) { return c.slug === slug; });
}

function vyroGetProduct(id) {
  return VYRO_PRODUCTS.find(function (p) { return p.id === id; });
}

function vyroGetProductCoverImage(id) {
  const images = {
    "calisthenics-8week": "calisthenics-cover.png",
    "high-protein-50": "food-cover.png",
    "mens-style-guide": "style-cover.png",
    "habit-reset": "habit-cover.png",
    "home-workout-30": "workout-cover.png",
    "meal-prep-system": "meal-cover.png",
    "womens-style-capsule": "wardrobe-cover.png",
    "deep-work-system": "productivity-cover.png"
  };
  return images[id] || "";
}
