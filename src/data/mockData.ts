export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  verified: boolean;
  followers: number;
  following: number;
  posts: number;
}

export type PostType = "photo" | "video" | "carousel" | "reel";

export interface Post {
  id: string;
  user: User;
  type: PostType;
  imageUrl: string;
  images?: string[]; // for carousel
  videoUrl?: string; // for video/reel
  caption: string;
  likes: number;
  comments: Comment[];
  timestamp: string;
  liked: boolean;
  saved: boolean;
  shares: number;
  // algorithm scoring
  engagementScore: number;
  createdAt: number; // epoch ms for sorting
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  timestamp: string;
  likes: number;
}

export interface Story {
  id: string;
  user: User;
  seen: boolean;
}

export const currentUser: User = {
  id: "me",
  username: "jiran_user",
  displayName: "Jiran User",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
  bio: "📸 Photography | 🌍 Travel | ✨ Living my best life",
  verified: true,
  followers: 1243,
  following: 567,
  posts: 48,
};

export const users: User[] = [
  {
    id: "1", username: "sarah_art", displayName: "Sarah Ahmed",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    bio: "🎨 Artist & Designer", verified: true, followers: 12400, following: 340, posts: 234,
  },
  {
    id: "2", username: "travel_nafi", displayName: "Nafi Rahman",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    bio: "🌏 World traveler", verified: false, followers: 5600, following: 890, posts: 156,
  },
  {
    id: "3", username: "foodie_mim", displayName: "Mim Sultana",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    bio: "🍕 Food blogger", verified: true, followers: 23000, following: 210, posts: 512,
  },
  {
    id: "4", username: "dev_rahim", displayName: "Rahim Khan",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    bio: "💻 Full-stack dev", verified: false, followers: 3200, following: 450, posts: 78,
  },
  {
    id: "5", username: "fitness_tania", displayName: "Tania Akter",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    bio: "💪 Fitness coach", verified: true, followers: 45000, following: 120, posts: 890,
  },
  {
    id: "6", username: "photo_arif", displayName: "Arif Hossain",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    bio: "📷 Photographer", verified: false, followers: 8700, following: 320, posts: 345,
  },
];

export const stories: Story[] = [
  { id: "s0", user: currentUser, seen: false },
  ...users.map((u, i) => ({ id: `s${i + 1}`, user: u, seen: i > 2 })),
];

const postImages = [
  "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1526512340740-9217d0159da9?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=600&h=600&fit=crop",
];

const carouselSets = [
  [
    "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=600&fit=crop",
  ],
  [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=600&fit=crop",
  ],
];

// Sample videos (free stock)
const sampleVideos = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
];

const captions = [
  "✨ Chasing sunsets and making memories",
  "🌊 The ocean heals everything",
  "🍜 Best ramen in Dhaka! Who wants to try?",
  "🏔️ Views from the top are always worth the climb",
  "📸 Golden hour never disappoints",
  "🌿 Finding peace in nature",
  "📚 Lost in a good book today",
  "🎨 New art piece just dropped!",
  "🔥 Quick workout routine for busy mornings",
  "🎬 Behind the scenes of today's shoot",
];

const now = Date.now();

const makeComments = (ui: number, pi: number): Comment[] => [
  {
    id: `c${ui}-${pi}-1`,
    user: users[(ui + 1) % users.length],
    text: "Amazing! 🔥",
    timestamp: "2h",
    likes: 12,
  },
  {
    id: `c${ui}-${pi}-2`,
    user: users[(ui + 2) % users.length],
    text: "Love this so much ❤️",
    timestamp: "1h",
    likes: 5,
  },
];

// Assign post types in a pattern: photo, carousel, photo, video, photo, reel, ...
const typePattern: PostType[] = ["photo", "carousel", "photo", "video", "photo", "reel", "photo", "photo", "carousel", "video", "reel", "photo"];

const rawPosts: Post[] = users.flatMap((user, ui) =>
  [0, 1].map((pi) => {
    const idx = ui * 2 + pi;
    const type = typePattern[idx % typePattern.length];
    const likes = Math.floor(Math.random() * 5000) + 100;
    const commentsArr = makeComments(ui, pi);
    const hoursAgo = Math.floor(Math.random() * 48) + 1;

    return {
      id: `p${ui}-${pi}`,
      user,
      type,
      imageUrl: postImages[idx % postImages.length],
      images: type === "carousel" ? carouselSets[idx % carouselSets.length] : undefined,
      videoUrl: type === "video" || type === "reel" ? sampleVideos[idx % sampleVideos.length] : undefined,
      caption: captions[idx % captions.length],
      likes,
      comments: commentsArr,
      timestamp: `${hoursAgo}h`,
      liked: Math.random() > 0.5,
      saved: Math.random() > 0.7,
      shares: Math.floor(Math.random() * 200),
      engagementScore: likes * 1 + commentsArr.length * 3 + Math.floor(Math.random() * 200) * 2,
      createdAt: now - hoursAgo * 3600 * 1000,
    };
  })
);

// Algorithm: weighted score of recency + engagement + relevance
function feedScore(post: Post): number {
  const hoursAgo = (now - post.createdAt) / (3600 * 1000);
  const recencyScore = Math.max(0, 100 - hoursAgo * 2); // newer = higher
  const engagementNorm = Math.min(post.engagementScore / 100, 100);
  // Weight: 40% recency, 45% engagement, 15% random relevance
  return recencyScore * 0.4 + engagementNorm * 0.45 + Math.random() * 15;
}

export const posts: Post[] = [...rawPosts].sort((a, b) => feedScore(b) - feedScore(a));

export const exploreImages = [
  "https://images.unsplash.com/photo-1682695796954-bad0d0f59ff1?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1526512340740-9217d0159da9?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=400&fit=crop",
];
