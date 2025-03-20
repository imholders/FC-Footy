import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  ScoreSquare,
  GameCreated,
  TicketsPurchased,
  GameFinalized,
  PrizesDistributed,
  TicketsRefunded,
  CommunityWalletLocked,
  CommunityWalletUpdated
} from "../generated/ScoreSquare/ScoreSquare"
import { Game, Ticket, Winner, GameStat } from "../generated/schema"

// Initialize or load GameStat entity
function getOrCreateGameStat(): GameStat {
  let stats = GameStat.load("1")
  
  if (stats == null) {
    stats = new GameStat("1")
    stats.totalGames = BigInt.fromI32(0)
    stats.totalTicketsSold = BigInt.fromI32(0)
    stats.totalPrizePool = BigInt.fromI32(0)
  }
  
  return stats
}

export function handleGameCreated(event: GameCreated): void {
  let game = new Game(event.params.gameId.toString())
  game.gameId = event.params.gameId
  game.eventId = event.params.eventId
  game.deployer = event.params.deployer
  game.squarePrice = event.params.squarePrice
  game.referee = event.params.referee
  game.deployerFeePercent = event.params.deployerFeePercent
  game.ticketsSold = 0
  game.prizePool = BigInt.fromI32(0)
  game.prizeClaimed = false
  game.refunded = false
  game.createdAt = event.block.timestamp
  game.save()
  
  // Update stats
  const stats = getOrCreateGameStat()
  stats.totalGames = stats.totalGames.plus(BigInt.fromI32(1))
  stats.lastGameCreatedAt = event.block.timestamp
  stats.save()
}

export function handleTicketsPurchased(event: TicketsPurchased): void {
  let gameId = event.params.gameId.toString()
  let game = Game.load(gameId)
  if (game == null) return
  
  let numTickets = event.params.numTickets
  game.ticketsSold += numTickets
  const ticketPrice = game.squarePrice
  const additionalPrizePool = ticketPrice.times(BigInt.fromI32(numTickets))
  game.prizePool = game.prizePool.plus(additionalPrizePool)
  game.save()
  
  // Create ticket entities
  // Note: We can't directly query the contract in mappings, so we'll create tickets based on event data
  // This is a simplified approach - in a real implementation, you might need to use another event or approach
  for (let i = 0; i < numTickets; i++) {
    let ticketId = gameId + "-" + event.transaction.hash.toHexString() + "-" + i.toString()
    let ticket = new Ticket(ticketId)
    ticket.game = gameId
    ticket.buyer = event.params.buyer
    ticket.squareIndex = i // This is a placeholder - we don't know the actual square index
    ticket.purchasedAt = event.block.timestamp
    ticket.save()
  }
  
  // Update global stats
  const stats = getOrCreateGameStat()
  stats.totalTicketsSold = stats.totalTicketsSold.plus(BigInt.fromI32(numTickets))
  stats.totalPrizePool = stats.totalPrizePool.plus(additionalPrizePool)
  stats.save()
}

export function handleGameFinalized(event: GameFinalized): void {
  let gameId = event.params.gameId.toString()
  let game = Game.load(gameId)
  if (game == null) return
  
  // Instead of using arrays, store the winning squares as individual entities
  for (let i = 0; i < event.params.winningSquares.length; i++) {
    let squareIndex = event.params.winningSquares[i]
    let percentage = event.params.winnerPercentages[i]
    
    // Create Winner entity
    const winnerId = gameId + "-winner-" + i.toString()
    const winner = new Winner(winnerId)
    winner.game = gameId
    winner.squareIndex = squareIndex
    winner.percentage = percentage
    winner.finalizedAt = event.block.timestamp
    winner.save()
  }
  
  // Skip setting the arrays directly on the game entity
  game.save()
}

export function handlePrizesDistributed(event: PrizesDistributed): void {
  let gameId = event.params.gameId.toString()
  let game = Game.load(gameId)
  if (game == null) return
  
  game.prizeClaimed = true
  game.save()
}

export function handleTicketsRefunded(event: TicketsRefunded): void {
  let gameId = event.params.gameId.toString()
  let game = Game.load(gameId)
  if (game == null) return
  
  game.refunded = true
  game.save()
}

// Add handlers for the additional events in score-square-v1
export function handleCommunityWalletLocked(event: CommunityWalletLocked): void {
  // Implementation for community wallet locked event
  // This is a placeholder - add your implementation as needed
}

export function handleCommunityWalletUpdated(event: CommunityWalletUpdated): void {
  // Implementation for community wallet updated event
  // This is a placeholder - add your implementation as needed
}
