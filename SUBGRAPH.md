# Subgraph Integration

This document explains how the subgraph is integrated with the FC-Footy frontend application.

## Overview

The FC-Footy application uses a subgraph deployed on The Graph to query blockchain data efficiently. The subgraph indexes events from the ScoreSquare contract on the Base network, making it easy to query game data, tickets, and winners.

## Directory Structure

- `/subgraph`: Contains the subgraph code
  - `schema.graphql`: Defines the GraphQL schema for the subgraph
  - `subgraph.yaml`: Configuration file for the subgraph
  - `src/mapping.ts`: Contains the event handlers for the subgraph

## Frontend Integration

The frontend integrates with the subgraph using Apollo Client:

- `/src/lib/apollo-client.ts`: Apollo Client configuration
- `/src/lib/graphql/queries.ts`: GraphQL queries for the subgraph
- `/src/hooks/useSubgraphData.ts`: Custom hooks for using the subgraph data

## Setup

Before using the subgraph, you need to:

1. Update the Studio ID in `/src/lib/apollo-client.ts`:
   ```typescript
   const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/STUDIO_ID/score-square-v1/version/latest';
   ```
   Replace `STUDIO_ID` with your actual Studio ID from The Graph Studio.

2. Make sure the subgraph is deployed and synced:
   ```bash
   # Generate code from schema
   yarn subgraph:codegen
   
   # Build the subgraph
   yarn subgraph:build
   
   # Deploy the subgraph
   yarn subgraph:deploy
   ```

## Usage

The application uses custom hooks to query the subgraph:

```typescript
// Get all games
const { data, loading, error } = useGames();

// Get a specific game by ID
const { data, loading, error } = useGameById('1');

// Get a game by event ID
const { data, loading, error } = useGameByEventId('NFL-KC-SF');

// Get overall statistics
const { data, loading, error } = useGameStats();

// Search for games
const { data, loading, error } = useSearchGames('NFL');
```

## Example Components

- `SubgraphGamesList.tsx`: Example component that demonstrates how to use the subgraph data
- `BlockchainScoreSquareBrowser.tsx`: Uses the subgraph data with fallback to direct contract calls

## Benefits

Using the subgraph provides several benefits:

1. **Performance**: Reduces the number of direct contract calls
2. **Historical Data**: Makes it easy to query historical data
3. **Complex Queries**: Enables complex queries that would be difficult with direct contract calls
4. **Indexing**: Automatically indexes new events as they occur

## Troubleshooting

If you encounter issues with the subgraph:

1. Check if the subgraph is properly deployed and synced
2. Verify that the Studio ID is correct in `apollo-client.ts`
3. Check the console for any GraphQL errors
4. The application will fall back to direct contract calls if the subgraph fails 