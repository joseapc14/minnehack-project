"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Filter, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";

const Sidebar = (props) => {
  const { coordinates } = props;
  const [isExpanded, setIsExpanded] = useState(true);

  const [closestEvents, setClosestEvents] = useState([
    {
      title: "Guthrie Theatre Community Tour",
      description:
        "Guthrie Theatre Community Tour dives into the history of Minneapolis’s iconic theatre’s history and famous past features.",
      isEvent: true,
    },
    {
      title: "Mill City Museum Tour",
      description:
        "History of the flour industry told through interactive exhibits in the rebuilt ruins of an old mill.",
      isEvent: true,
    },
    {
      title: "Grandpa's Stories of Old Minneapolis",
      description:
        "A collection of personal memories and experiences shared from a lifetime in Minneapolis.",
      isEvent: false,
    },
  ]);
  const [filter, setFilter] = useState("");
  const [filterType, setFilterType] = useState({
    events: true, // true means selected, false means unselected
    memories: true, // true means selected, false means unselected
  });
  const [showDropdown, setShowDropdown] = useState(false);

  const handleCheckboxChange = (type) => {
    setFilterType((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const filteredEvents = closestEvents.filter((event) => {
    const matchesFilter = event.title
      .toLowerCase()
      .includes(filter.toLowerCase());
    const isEventSelected = filterType.events && event.isEvent;
    const isMemorySelected = filterType.memories && !event.isEvent;
    if (isEventSelected || isMemorySelected) return matchesFilter;
    return false;
  });

  return (
    <div className="relative">
      <motion.div
        animate={{ width: isExpanded ? 600 : 60 }}
        className="fixed right-0 top-0 h-screen shadow-md flex flex-col transition-all duration-300 z-50 border-l border-gray-300"
        style={{ background: "rgba(255, 255, 255, 0.85)" }}
      >
        <button
          className="absolute h-full pl-4 pr-4"
          style={{ background: "rgba(255, 255, 255, 0.3)" }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {!isExpanded ? <ChevronLeft /> : <ChevronRight />}
        </button>

        {/* filter */}
        {isExpanded && (
          <div className="ml-14 p-6 pb-0">
            {/* Dropdown */}
            <div className="relative group mb-2">
              <div className="flex">
                <div className="flex w-full items-center gap-2 p-2 bg-gray-200 rounded-lg group-hover:bg-gray-300 cursor-pointer transition duration-200">
                  <Filter className="cursor-pointer text-gray-700" size={20} />
                  <span className="font-medium font-semibold text-gray-800">Filter</span>
                </div>
              </div>
              <div
                className={`absolute top-10 left-0 bg-white shadow-lg border rounded-lg p-4 w-full group-hover:block hidden select-none`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="events"
                      checked={filterType.events}
                      onChange={() => handleCheckboxChange("events")}
                      className="cursor-pointer"
                    />
                    <label htmlFor="events" className="text-md cursor-pointer">
                      Events
                    </label>
                  </div>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="memories"
                      checked={filterType.memories}
                      onChange={() => handleCheckboxChange("memories")}
                      className="cursor-pointer"
                    />
                    <label
                      htmlFor="memories"
                      className="text-md cursor-pointer"
                    >
                      Memories
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <input
              type="text"
              placeholder="Search for an event..."
              className="p-2 border rounded-lg w-full"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <div className="mt-1">
              {filterType.events && filterType.memories
                ? "Showing both events and memories"
                : filterType.events
                ? "Showing events"
                : filterType.memories
                ? "Showing memories"
                : "No filter applied"}{" "}
              for [{coordinates[0].toFixed(3)}, {coordinates[1].toFixed(3)}]
            </div>
          </div>
        )}

        {/* events list */}
        {isExpanded && (
          <div className="flex flex-col gap-4 ml-14 p-6">
            {filteredEvents.map((event, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg shadow-sm bg-white"
              >
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

            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200 mt-4">
              <PlusCircle /> Add Your Own Event At Coordinates [
              {coordinates[0].toFixed(3)}, {coordinates[1].toFixed(3)}]
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Sidebar;
