/* eslint-disable */
import { useEffect, useState } from 'react';
import sportsData from './sportsData';  // Import the sportsData array

interface Event {
  links: any;
  venue: any;
  id: string;
  shortName: string;
  name: string;
  date: string;
  status: {
    displayClock: string;
    type: {
      detail: string;
    };
  };
  competitions: {
    odds: any;
    geoBroadcasts: any;
    headlines: any;
    status: any;
    competitors: {
      team: {
        abbreviation: string;
        logo: string;
        id: string;
      };
      score: number;
    }[];
    details: Detail[];
  }[];
}

interface Detail {
  athletesInvolved: Array<{ displayName: string }>;
  type: {
    text: string;
  };
  clock: {
    displayValue: string;
  };
  team: {
    id: string;
  };
}

function useEventsData(selectedSport: string) {
  const [events, setEvents] = useState<Event[]>([]); // Use the Event type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEventsData() {
      setLoading(true);
      setError(null);
      // console.log("Fetching events data for selected sport:", selectedSport);
      
      try {
        const sport = sportsData.find(s => s.sportId === selectedSport);
        if (!sport) {
          throw new Error("Invalid sport selected");
        }
    
        const response = await fetch(sport.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${sport.name}`);
        }
    
        // ✅ FIX: Call response.json() only once and store it in a variable
        const data = await response.json();
        // console.log("✅ Response received:", data); // Log the parsed data, not response.json()
        
        setEvents(data.events || []);
      } catch (error) {
        setError('Failed to load events data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    

    if (selectedSport) {
      fetchEventsData();
    }
  }, [selectedSport]);  // Dependency array includes selectedSport

  return { events, loading, error };
}

export default useEventsData;
