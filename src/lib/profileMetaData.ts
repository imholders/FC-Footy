interface Geo {
    lat: number;
    lng: number;
    precision?: string;  // Optional precision level for geo location (e.g., "city", "street", "exact")
  }
  
interface PersonalInfo {
    firstName: string | null;  // First name can either be a string or null
    lastName: string | null;   // Last name can either be a string or null
    pronouns: string;
    geo: Geo;
  }
  
interface AppMetadata {
    appName: string;  // The name of the app writing this section
    domain: string;  // Domain of the app (e.g., app's website or identifier)
    data: { name: string, value: unknown }[];  // Array of key-value pairs for app-specific data
}

interface UserProfile {
    FID: string;  // Unique identifier for each user profile, consistent across apps
    version: string;
    schemaVersion: string;  // Version of the schema for future updates
    userName: string;  // User's Farcaster name (or similar unique handle)
    personalInfo: PersonalInfo;
    apps: AppMetadata[];  // Array of app-specific metadata
}
  
const userProfile: UserProfile = {
    FID: "kmacb.eth",  // Unique identifier for this user across all apps
    version: "1.1.0",
    schemaVersion: "1.0.0",  // Initial schema version
    userName: "kmacb.eth",
    personalInfo: {
      firstName: null,
      lastName: null,
      pronouns: "he/him",
      geo: {
        lat: 37.7749,
        lng: -122.4194,
        precision: "city",
      },
    },
    apps: [
      {
        appName: "Example App",
        domain: "appone.example.com",
        data: [
          { name: "favoriteColor", value: "Blue" },
          { name: "notificationsEnabled", value: true },
          { name: "theme", value: "dark" },  // You can easily add new properties here
        ],
      },
    ],
  };
  
  export default userProfile;