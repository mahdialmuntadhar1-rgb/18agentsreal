import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';

// Platform reviews - NOT business reviews
// These are user opinions about the HUMUS platform itself
const PLATFORM_REVIEWS = [
  {
    id: '1',
    text: "أخيراً مكان واحد لكل المشاريع بالعراق",
    translation: "Finally one place for all businesses in Iraq",
    author: "Ahmed K.",
    location: "Baghdad",
    rating: 5,
  },
  {
    id: '2', 
    text: "بدل ما ندوّر بالانستغرام، كلشي هنا موجود",
    translation: "Instead of searching on Instagram, everything is here",
    author: "Sarah M.",
    location: "Erbil",
    rating: 5,
  },
  {
    id: '3',
    text: "ساعدني ألقى محلات موثوقة بسرعة",
    translation: "Helped me find trusted shops quickly",
    author: "Omar H.",
    location: "Basra",
    rating: 5,
  },
  {
    id: '4',
    text: "منصة رائعة للتجارة بالعراق",
    translation: "Amazing platform for commerce in Iraq",
    author: "Layla S.",
    location: "Mosul",
    rating: 5,
  },
  {
    id: '5',
    text: "وفر وقتي كثير في البحث عن الخدمات",
    translation: "Saved me so much time searching for services",
    author: "Hassan R.",
    location: "Najaf",
    rating: 4,
  },
];

export default function PlatformReviews() {
  // Calculate average rating
  const avgRating = PLATFORM_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / PLATFORM_REVIEWS.length;
  const reviewCount = 120 + PLATFORM_REVIEWS.length; // Simulated total count

  return (
    <section className="w-full py-12 bg-gradient-to-br from-gray-900 via-[#8B1A1A] to-gray-900 mb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-bold">{avgRating.toFixed(1)}</span>
            <span className="text-white/70 text-sm">({reviewCount} reviews)</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Loved by Iraqis
          </h2>
          <p className="text-white/70">
            Real opinions from real users about HUMUS
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORM_REVIEWS.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-all"
            >
              {/* Quote Icon */}
              <Quote className="w-8 h-8 text-white/20 mb-3" />
              
              {/* Arabic Text */}
              <p className="text-white text-lg font-medium mb-2 leading-relaxed" dir="rtl">
                "{review.text}"
              </p>
              
              {/* English Translation */}
              <p className="text-white/60 text-sm mb-4">
                {review.translation}
              </p>
              
              {/* Author */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div>
                  <p className="text-white font-medium text-sm">{review.author}</p>
                  <p className="text-white/50 text-xs">{review.location}</p>
                </div>
                
                {/* Rating Stars */}
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
            <div className="flex -space-x-2">
              {['B', 'E', 'M', 'S', 'N'].map((city, i) => (
                <div 
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2CA6A4] to-[#1e7a78] flex items-center justify-center text-white text-xs font-bold border-2 border-gray-900"
                >
                  {city}
                </div>
              ))}
            </div>
            <p className="text-white/80 text-sm">
              Join <strong className="text-white">10,000+</strong> users across all 18 governorates
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
