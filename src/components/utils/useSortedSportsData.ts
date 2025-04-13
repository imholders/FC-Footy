import { useEffect, useState } from "react";
import sportsData from "./sportsData";

interface Sport {
  name: string;
  sportId: string;
  url: string;
}

interface Event {
  id: string;
  date: string;
  status: {
    type: {
      state: "pre" | "in" | "post";
    };
  };
}

const useSortedSportsData = () => {
  const [sortedSports, setSortedSports] = useState<Sport[]>(sportsData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        setLoading(true);
        const sportsWithStatus = await Promise.all(
          sportsData.map(async (sport) => {
            try {
              const response = await fetch(sport.url);
              const data = await response.json();
              const events: Event[] = data.events || [];

              // Check for live matches
              const hasLive = events.some(
                (event) => event.status.type.state === "in"
              );

              // Find earliest upcoming match
              const upcomingEvents = events.filter(
                (event) => event.status.type.state === "pre"
              );
              const earliestDate = upcomingEvents.length
                ? Math.min(
                    ...upcomingEvents.map((event) =>
                      new Date(event.date).getTime()
                    )
                  )
                : Infinity;

              return {
                sport,
                hasLive,
                earliestDate,
              };
            } catch (error) {
              console.error(`Error fetching ${sport.name}:`, error);
              return { sport, hasLive: false, earliestDate: Infinity };
            }
          })
        );

        // Sort sports based on status
        const sorted = sportsWithStatus.sort((a, b) => {
          // Priority 1: Live matches
          if (a.hasLive && !b.hasLive) return -1;
          if (!a.hasLive && b.hasLive) return 1;

          // Priority 2: Earliest upcoming match
          if (a.earliestDate !== b.earliestDate) {
            return a.earliestDate - b.earliestDate;
          }

          // Priority 3: Alphabetical by name (fallback)
          return a.sport.name.localeCompare(b.sport.name);
        });

        setSortedSports(sorted.map((item) => item.sport));
      } catch (error) {
        console.error("Error sorting sports:", error);
        setSortedSports(sportsData); // Fallback to original order
      } finally {
        setLoading(false);
      }
    };

    fetchAllEvents();
  }, []);

  return { sortedSports, loading };
};

export default useSortedSportsData;