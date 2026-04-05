import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Clock } from "lucide-react";
import type { Business } from "@/lib/supabase";

interface FeedComponentProps {
  businesses: Business[];
  loading: boolean;
}

interface FeedPost {
  id: string;
  type: "announcement" | "listing";
  business: Business;
  content?: string;
  timestamp?: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
}

export default function FeedComponent({ businesses, loading }: FeedComponentProps) {
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Generate feed posts from businesses (alternating between announcements and listings)
    const posts: FeedPost[] = [];

    businesses.forEach((business, index) => {
      const postType = index % 2 === 0 ? "announcement" : "listing";

      posts.push({
        id: `${business.id}-${postType}`,
        type: postType,
        business,
        content:
          postType === "announcement"
            ? `Check out our latest updates! Visit ${business.business_name} today.`
            : undefined,
        timestamp: `${Math.floor(Math.random() * 24)} hours ago`,
        likes: Math.floor(Math.random() * 500),
        comments: Math.floor(Math.random() * 50),
        shares: Math.floor(Math.random() * 100),
      });
    });

    setFeedPosts(posts);
  }, [businesses]);

  const handleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="h-12 bg-gray-200 rounded-full w-32 mb-4" />
              <div className="h-24 bg-gray-200 rounded mb-4" />
              <div className="h-8 bg-gray-200 rounded w-48" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 pb-20">
      {feedPosts.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-[#cbd5e1] p-16 text-center shadow-inner">
          <div className="w-20 h-20 bg-[#F5F7F9] rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🔍</div>
          <p className="text-[#2B2F33] font-bold text-lg mb-2 poppins-bold">No businesses found</p>
          <p className="text-sm text-[#64748b] max-w-xs mx-auto">
            Try selecting a different location or category to discover local gems.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {feedPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-[24px] border border-[#e2e8f0] shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden group"
            >
              {/* Post Header */}
              <div className="p-5 border-b border-[#f1f5f9] flex items-center justify-between bg-gradient-to-r from-white to-[#FDECEC]/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#8B1A1A]/10 flex items-center justify-center text-[#8B1A1A] font-bold border border-[#8B1A1A]/5 shadow-inner overflow-hidden">
                    {post.business.image ? (
                      <img
                        src={post.business.image}
                        alt={post.business.business_name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-xl">{post.business.business_name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2B2F33] text-base poppins-semibold group-hover:text-[#8B1A1A] transition-colors">
                      {post.business.business_name}
                    </h3>
                    <p className="text-[10px] text-[#8B1A1A]/60 flex items-center gap-1.5 mt-0.5 font-bold uppercase tracking-widest">
                      <Clock size={12} className="text-[#8B1A1A]" /> {post.timestamp}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-4 py-1.5 rounded-xl uppercase tracking-widest shadow-sm ${
                  post.type === "announcement" 
                    ? "bg-[#8B1A1A] text-white" 
                    : "bg-[#8B1A1A] text-white"
                }`}>
                  {post.type === "announcement" ? "📢 Update" : "📍 Listing"}
                </span>
              </div>

              {/* Post Content */}
              {post.type === "announcement" && post.content && (
                <div className="px-6 pt-6">
                  <p className="text-[#2B2F33] text-sm leading-relaxed mb-4 font-medium">
                    {post.content}
                  </p>
                </div>
              )}

              {/* Image Section with Depth */}
              <div className="px-6 pt-4">
                <div className="w-full h-80 bg-gray-100 rounded-2xl overflow-hidden relative shadow-inner group/img">
                  <img
                    src={
                      post.business.image ||
                      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop"
                    }
                    alt={post.business.business_name}
                    className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300" />
                </div>
              </div>

              {/* Post Info - Listings */}
              {post.type === "listing" && (
                <div className="px-6 pt-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#FDECEC]/30 p-3 rounded-2xl border border-[#8B1A1A]/10">
                      <p className="text-[9px] text-[#8B1A1A]/60 font-bold uppercase tracking-widest mb-1">Category</p>
                      <p className="text-xs font-bold text-[#8B1A1A] uppercase">
                        {post.business.category.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="bg-[#FDECEC]/30 p-3 rounded-2xl border border-[#8B1A1A]/10">
                      <p className="text-[9px] text-[#8B1A1A]/60 font-bold uppercase tracking-widest mb-1">Rating</p>
                      <p className="text-xs font-bold text-[#8B1A1A] flex items-center gap-1">
                        ⭐ {post.business.rating?.toFixed(1) || "N/A"}
                        <span className="text-[#8B1A1A]/60 text-[10px] font-medium">
                          ({post.business.reviewCount || 0} reviews)
                        </span>
                      </p>
                    </div>
                    <div className="col-span-2 bg-[#FDECEC]/30 p-3 rounded-2xl border border-[#8B1A1A]/10 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-[#8B1A1A]/60 font-bold uppercase tracking-widest mb-1">Location</p>
                        <p className="text-xs font-bold text-[#2B2F33]">
                          📍 {post.business.governorate}
                        </p>
                      </div>
                      <button className="text-[10px] font-bold text-[#8B1A1A] hover:underline uppercase tracking-widest">View Map</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Engagement Section */}
              <div className="px-6 py-5 bg-[#F5F7F9]/30 border-t border-[#f1f5f9]">
                {/* Stats */}
                <div className="flex justify-between text-[10px] text-[#64748b] font-bold uppercase tracking-widest mb-5 pb-5 border-b border-[#f1f5f9]">
                  <span className="flex items-center gap-2 hover:text-[#E87A41] cursor-pointer transition-colors">❤️ {post.likes} <span className="hidden sm:inline">Likes</span></span>
                  <span className="flex items-center gap-2 hover:text-[#2CA6A4] cursor-pointer transition-colors">💬 {post.comments} <span className="hidden sm:inline">Comments</span></span>
                  <span className="flex items-center gap-2 hover:text-[#2CA6A4] cursor-pointer transition-colors">📤 {post.shares} <span className="hidden sm:inline">Shares</span></span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all duration-300 ${
                      likedPosts.has(post.id)
                        ? "bg-[#8B1A1A] text-white shadow-lg shadow-[#8B1A1A]/20"
                        : "bg-white text-[#64748b] border border-[#f5dada] hover:bg-[#8B1A1A]/5 hover:text-[#8B1A1A] hover:border-[#8B1A1A]/20"
                    }`}
                  >
                    <Heart
                      size={16}
                      className={likedPosts.has(post.id) ? "fill-current" : ""}
                    />
                    Like
                  </button>

                  <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-[#f5dada] hover:bg-[#8B1A1A]/5 hover:text-[#8B1A1A] hover:border-[#8B1A1A]/20 text-[#64748b] rounded-xl font-bold text-xs transition-all duration-300">
                    <MessageCircle size={16} />
                    Comment
                  </button>

                  <button className="w-12 flex items-center justify-center bg-white border border-[#f5dada] hover:bg-[#8B1A1A] hover:text-white text-[#64748b] rounded-xl transition-all duration-300">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>

              {/* Quick Contact Bar */}
              {post.type === "listing" && (
                <div className="px-6 py-4 bg-[#2B2F33] flex gap-3">
                  {post.business.phone_1 && (
                    <a
                      href={`tel:${post.business.phone_1}`}
                      className="flex-1 py-2.5 bg-[#8B1A1A] hover:bg-[#6b1414] text-white text-[10px] font-bold rounded-xl transition-all duration-300 text-center shadow-lg uppercase tracking-widest"
                    >
                      Call Now
                    </a>
                  )}
                  <button className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-xl transition-all duration-300 uppercase tracking-widest border border-white/10">
                    WhatsApp
                  </button>
                  <button className="flex-1 py-2.5 bg-[#8B1A1A]/80 hover:bg-[#8B1A1A] text-white text-[10px] font-bold rounded-xl transition-all duration-300 uppercase tracking-widest shadow-lg">
                    Profile
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Load More Button */}
          <div className="text-center pt-10">
            <button className="btn-premium bg-[#8B1A1A] px-16 py-4 rounded-2xl shadow-xl hover:shadow-[#8B1A1A]/30 text-sm uppercase tracking-widest">
              Load More Businesses
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
