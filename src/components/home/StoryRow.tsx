import React from 'react';
import { motion } from 'motion/react';

const STORIES = [
  { id: 1, name: 'Offers', image: 'https://picsum.photos/seed/offer/200/200', color: '#8B1A1A' },
  { id: 2, name: 'Events', image: 'https://picsum.photos/seed/event/200/200', color: '#E91E63' },
  { id: 3, name: 'New Jobs', image: 'https://picsum.photos/seed/job/200/200', color: '#2196F3' },
  { id: 4, name: 'Trending', image: 'https://picsum.photos/seed/trend/200/200', color: '#FF9800' },
  { id: 5, name: 'Top Rated', image: 'https://picsum.photos/seed/rate/200/200', color: '#4CAF50' },
  { id: 6, name: 'Food', image: 'https://picsum.photos/seed/food/200/200', color: '#795548' },
  { id: 7, name: 'Fashion', image: 'https://picsum.photos/seed/fashion/200/200', color: '#9C27B0' },
  { id: 8, name: 'Tech', image: 'https://picsum.photos/seed/tech/200/200', color: '#607D8B' },
];

export default function StoryRow() {
  return (
    <div className="w-full overflow-hidden mb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {STORIES.map((story) => (
            <motion.div
              key={story.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
            >
              <div className="relative p-1 rounded-full border-2 border-[#8B1A1A] bg-white shadow-md">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
                  <img 
                    src={story.image} 
                    alt={story.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div 
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold"
                  style={{ backgroundColor: story.color }}
                >
                  +
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#2B2F33] uppercase tracking-wider">
                {story.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
