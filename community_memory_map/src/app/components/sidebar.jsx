"use client";
import { useState } from "react";
import {
  Home,
  Menu,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  const [closestEvents, setClosestEvents] = useState([
    {
      title: "Guthrie Theatre Community Tour",
      description:
        "Guthrie Theatre Community Tour dives into the history of Minneapolis’s iconic theatre’s history and famous past features.",
    },
    {
      title: "Mill City Museum Tour",
      description:
        "History of the flour industry told through interactive exhibits in the rebuilt ruins of an old mill.",
    },
  ]);

  return (
    <div className="relative">
      <motion.div
        animate={{ width: isExpanded ? 500 : 60 }}
        className="fixed right-0 top-0 h-screen shadow-md p-4 flex flex-col transition-all duration-300 z-50 border-l border-gray-300"
        style={{ background: "rgba(255, 255, 255, 0.85)" }}
      >
        <button
          className="absolute h-full"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {!isExpanded ? <ChevronLeft /> : <ChevronRight />}
        </button>

        {isExpanded && (
          <div className="flex flex-col gap-4 ml-10">
            {closestEvents.map((event, index) => (
              <div key={index} className="p-4 border rounded-lg shadow-sm">
                <h2 className="font-bold text-lg">{event.title}</h2>
                <p className="text-sm text-gray-600">{event.description}</p>
                <div className="flex gap-2 mt-2">
                  <button className="px-4 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200">
                    JOIN
                  </button>
                  <button className="px-4 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200">
                    RECORD YOUR PAST EXPERIENCE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Sidebar;
