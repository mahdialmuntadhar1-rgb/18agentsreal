import React from 'react';
import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';

const cities = [
  "Baghdad City", "Erbil City", "Sulaymaniyah City", "Basra City", "Duhok City", "Kirkuk City", 
  "Najaf City", "Karbala City", "Dhi Qar City", "Babil City", "Anbar City", "Diyala City", 
  "Muthanna City", "Al-Qadisiyah City", "Maysan City", "Wasit City", "Saladin City", "Nineveh City"
];

interface CityGridProps {
  onSelect: (city: string) => void;
  agentStatuses: Record<string, string>;
}

export const CityGrid: React.FC<CityGridProps> = ({ onSelect, agentStatuses }) => {
  const isAgentActive = (city: string) => {
    return Object.entries(agentStatuses).some(([name, status]) => 
      name.toLowerCase().includes(city.toLowerCase()) && status === "active"
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6">
      {cities.map((city) => (
        <motion.div
          key={city}
          whileHover={{ scale: 1.05, borderColor: '#bc13fe' }}
          onClick={() => onSelect(city)}
          className="cursor-pointer bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center transition-all hover:border-vibrant-purple/50"
        >
          <div className="text-purple-400 mb-2">
             <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <MapPin className="text-vibrant-purple" size={20} />
             </div>
          </div>
          <h3 className="text-white font-bold text-sm tracking-wide">{city}</h3>
          
          {/* Active Agent Pulse */}
          <div className="mt-2 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {isAgentActive(city) && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isAgentActive(city) ? 'bg-purple-500' : 'bg-white/20'}`}></span>
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-tighter">
              {isAgentActive(city) ? 'Agent Active' : 'Agent Idle'}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
