# ScoreSquare Subgraph

This subgraph indexes events from the ScoreSquare smart contract on Base, allowing for efficient querying of game data without direct blockchain calls.

## Overview

The ScoreSquare subgraph tracks the following entities:

- **Games**: All deployed score square games
- **Squares**: Individual squares purchased by users
- **GameResults**: Final results of completed games

## Deployment

The subgraph is deployed to The Graph Studio at:

```
https://api.studio.thegraph.com/query/106307/score-square-v1/version/latest
```

## Example Queries

### Get Recent Games

```graphql
{
  games(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    gameId
    eventId
    deployer
    squarePrice
    referee
    deployerFeePercent
    ticketsSold
    prizePool
    prizeClaimed
    refunded
    createdAt
  }
}
```

### Get Active Games

```graphql
{
  games(where: {prizeClaimed: false}, orderBy: createdAt, orderDirection: desc) {
    id
    gameId
    eventId
    deployer
    squarePrice
    ticketsSold
    prizePool
  }
}
```

### Get Completed Games

```graphql
{
  games(where: {prizeClaimed: true}, orderBy: createdAt, orderDirection: desc) {
    id
    gameId
    eventId
    deployer
    squarePrice
    ticketsSold
    prizePool
  }
}
```

### Get Squares for a Game

```graphql
{
  squares(where: {game: "GAME_ID"}) {
    id
    game {
      id
      eventId
    }
    owner
    squareId
    homeDigit
    awayDigit
    purchasedAt
  }
}
```

## Frontend Integration

The subgraph is integrated into the FC-Footy frontend using Apollo Client. The integration includes:

1. **Apollo Client Setup**: Configuration in `src/lib/apollo-client.ts`
2. **Custom Hooks**: Data fetching hooks in `src/hooks/useSubgraphData.ts`
3. **Components**:
   - `ActiveGamesBrowser.tsx`: Displays active games in a table format
   - `CompletedGamesBrowser.tsx`: Displays completed games in a table format
   - `GameNavigation.tsx`: Navigation between game-related pages

## Utilities

- `eventIdParser.ts`: Parses the eventId string to extract team and league information

## Development

To update the subgraph:

1. Make changes to the schema in `schema.graphql`
2. Update mappings in `src/mapping.ts`
3. Generate types with `npm run codegen`
4. Deploy with `npm run deploy`

## Benefits of Subgraph Integration

- **Improved Performance**: Reduced reliance on direct blockchain calls
- **Complex Queries**: Ability to filter, sort, and paginate data efficiently
- **Real-time Updates**: Automatic indexing of new contract events
- **Reduced Frontend Complexity**: Simplified data fetching logic 