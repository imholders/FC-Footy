import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// The Graph Studio endpoint for your subgraph
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/106307/score-square-v1/version/latest';

// Create an HTTP link to the subgraph
const httpLink = new HttpLink({
  uri: SUBGRAPH_URL,
});

// Create the Apollo Client instance
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only', // Don't use the cache by default
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only', // Don't use the cache by default
      errorPolicy: 'all',
    },
  },
}); 