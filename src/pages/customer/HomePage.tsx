import React from 'react';
import { HeroSection } from '../../components/customer/HeroSection';
import { FeaturedSection } from '../../components/customer/FeaturedSection';
import { SourcingStory } from '../../components/customer/SourcingStory';
import { SocialGrid } from '../../components/customer/SocialGrid';
import { LocationMap } from '../../components/customer/LocationMap';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-0">
      <HeroSection />
      <FeaturedSection />
      <SourcingStory />
      <SocialGrid />
      <LocationMap />
    </div>
  );
};
