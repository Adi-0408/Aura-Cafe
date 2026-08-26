import React from 'react';
import { Instagram, Heart, MessageCircle } from 'lucide-react';

export const SocialGrid: React.FC = () => {
  const posts = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      caption: 'The morning ritual: Dialing in 18.5g of Yirgacheffe on the Slayer.',
      likes: 248,
      comments: 19
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
      caption: 'Fresh out of the deck oven: 72-hr fermented butter honeycomb layers.',
      likes: 512,
      comments: 44
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
      caption: 'Sunlit corners in the coastal patio lounge. Mindful pauses only.',
      likes: 389,
      comments: 26
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
      caption: 'Kyoto stone ground ceremonial matcha whisked with bamboo chasen.',
      likes: 420,
      comments: 31
    },
  ];

  return (
    <section className="py-20 bg-[#F6F9FA] border-b border-[#D2DFE2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1B8585] mb-1">
              <Instagram className="w-4 h-4" />
              <span>@auracoffeeandkitchen</span>
            </div>
            <h2 className="font-serif text-3xl font-bold text-[#10222B]">
              Moments from the Pacific Roastery & Espresso Bar
            </h2>
          </div>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B8585] hover:text-[#10222B] transition-colors"
          >
            <span>Follow Our Daily Journal</span>
            <span>→</span>
          </a>
        </div>

        {/* 4 Photo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-[#081318] shadow-warm-sm"
            >
              <img
                src={post.image}
                alt={post.caption}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-[#081318]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-white">
                <p className="text-xs line-clamp-3 leading-relaxed text-stone-200">
                  {post.caption}
                </p>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {post.comments}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
