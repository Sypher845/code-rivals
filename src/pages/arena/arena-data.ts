// User Stats
export interface UserStats {
  kdRatio: number;
  eloRating: number;
  league: string;
  leaguePercentile: number;
  kdTrend: number;
  eloTrend: number;
}

// Match History
export interface MatchRecord {
  id: string;
  opponentName: string;
  opponentElo: number;
  opponentLeague: string;
  winner: 'user' | 'opponent';
  pointsScored: number;  // out of 20
  deltaRating: number;   // positive or negative
  timestamp: Date;
}

// Friend
export interface Friend {
  id: string;
  username: string;
  elo: number;
  league: string;
  isOnline: boolean;
}

// Leaderboard Entry
export interface LeaderboardEntry {
  rank: number;
  username: string;
  elo: number;
  winRate: number;
  league: string;
  isCurrentUser: boolean;
}

// Mock Stats
export const mockStats: UserStats = {
  kdRatio: 2.45,
  eloRating: 1847,
  league: 'Diamond II',
  leaguePercentile: 85,
  kdTrend: 12,
  eloTrend: 47,
};

// Mock Match History (7 matches)
export const mockMatches: MatchRecord[] = [
  {
    id: '1',
    opponentName: 'r4ndom_pikachu',
    opponentElo: 1820,
    opponentLeague: 'Diamond I',
    winner: 'user',
    pointsScored: 18,
    deltaRating: 47,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    opponentName: 'mradul_dev',
    opponentElo: 1802,
    opponentLeague: 'Diamond I',
    winner: 'opponent',
    pointsScored: 12,
    deltaRating: -23,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    opponentName: 'algo_queen',
    opponentElo: 1890,
    opponentLeague: 'Diamond II',
    winner: 'user',
    pointsScored: 16,
    deltaRating: 31,
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
  {
    id: '4',
    opponentName: 'binary_ninja',
    opponentElo: 1756,
    opponentLeague: 'Platinum III',
    winner: 'user',
    pointsScored: 19,
    deltaRating: 28,
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
  },
  {
    id: '5',
    opponentName: 'code_wizard',
    opponentElo: 1910,
    opponentLeague: 'Diamond III',
    winner: 'opponent',
    pointsScored: 8,
    deltaRating: -35,
    timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000),
  },
  {
    id: '6',
    opponentName: 'syntax_error',
    opponentElo: 1780,
    opponentLeague: 'Platinum II',
    winner: 'user',
    pointsScored: 15,
    deltaRating: 22,
    timestamp: new Date(Date.now() - 120 * 60 * 60 * 1000),
  },
  {
    id: '7',
    opponentName: 'loop_master',
    opponentElo: 1830,
    opponentLeague: 'Diamond I',
    winner: 'user',
    pointsScored: 17,
    deltaRating: 38,
    timestamp: new Date(Date.now() - 144 * 60 * 60 * 1000),
  },
];

// Mock Friends
export const mockFriends: Friend[] = [
  { id: '1', username: 'r4ndom_pikachu', elo: 1847, league: 'Diamond II', isOnline: true },
  { id: '2', username: 'mradul_dev', elo: 1802, league: 'Diamond I', isOnline: false },
  { id: '3', username: 'algo_queen', elo: 1890, league: 'Diamond II', isOnline: true },
  { id: '4', username: 'binary_ninja', elo: 1756, league: 'Platinum III', isOnline: true },
  { id: '5', username: 'code_wizard', elo: 1910, league: 'Diamond III', isOnline: false },
  { id: '6', username: 'syntax_error', elo: 1780, league: 'Platinum II', isOnline: false },
  { id: '7', username: 'loop_master', elo: 1830, league: 'Diamond I', isOnline: true },
  { id: '8', username: 'hash_slinger', elo: 1690, league: 'Platinum I', isOnline: false },
  { id: '9', username: 'tree_hugger', elo: 1920, league: 'Diamond III', isOnline: true },
  { id: '10', username: 'stack_overflow', elo: 1745, league: 'Platinum III', isOnline: false },
];

// Mock Leaderboard (Diamond League)
export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, username: 'pro_coder_99', elo: 2145, winRate: 78, league: 'Diamond III', isCurrentUser: false },
  { rank: 2, username: 'algo_master', elo: 2089, winRate: 74, league: 'Diamond III', isCurrentUser: false },
  { rank: 3, username: 'tree_hugger', elo: 1920, winRate: 71, league: 'Diamond III', isCurrentUser: false },
  { rank: 4, username: 'code_wizard', elo: 1910, winRate: 68, league: 'Diamond III', isCurrentUser: false },
  { rank: 5, username: 'algo_queen', elo: 1890, winRate: 65, league: 'Diamond II', isCurrentUser: false },
  { rank: 6, username: 'r4ndom_pikachu', elo: 1847, winRate: 63, league: 'Diamond II', isCurrentUser: false },
  { rank: 7, username: 'loop_master', elo: 1830, winRate: 61, league: 'Diamond I', isCurrentUser: false },
  { rank: 8, username: 'you', elo: 1847, winRate: 62, league: 'Diamond II', isCurrentUser: true },
  { rank: 9, username: 'mradul_dev', elo: 1802, winRate: 58, league: 'Diamond I', isCurrentUser: false },
  { rank: 10, username: 'syntax_error', elo: 1780, winRate: 55, league: 'Diamond I', isCurrentUser: false },
];
