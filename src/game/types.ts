/** Core domain types for the career simulation. */

import type { Rng } from './rng'

export type Locale = 'es' | 'en'

/** Every player-visible string in the data layer carries both languages. */
export type Localized = { es: string; en: string }

export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C'

export type Hand = 'right' | 'left'

/** The seven visible attributes. Each has an explicit tradeoff, surfaced in the UI. */
export type AttributeKey =
  | 'shooting'
  | 'handling'
  | 'athleticism'
  | 'defense'
  | 'strength'
  | 'iq'
  | 'leadership'

export type Attributes = Record<AttributeKey, number>

export const ATTRIBUTE_KEYS: readonly AttributeKey[] = [
  'shooting',
  'handling',
  'athleticism',
  'defense',
  'strength',
  'iq',
  'leadership',
]

/** Hidden state the player feels but never sees as a raw number. */
export interface HiddenStats {
  /** Accumulated mileage. Drives injury odds and how steeply the decline curve bites. */
  wear: number
  /** Morale — affects performance swings and which event branches unlock. */
  morale: number
  /** Media/scouting stock. Drives draft position, offers and endorsement events. */
  hype: number
  /** How much the coach trusts you. Drives minutes, which drives everything else. */
  coachTrust: number
}

export type PlayStyleId =
  | 'scorer'
  | 'floor_general'
  | 'sharpshooter'
  | 'lockdown'
  | 'highlight'
  | 'franchise'

export interface PlayStyle {
  id: PlayStyleId
  name: Localized
  /** The gamble, stated plainly — F1 Glory's "Verstappen style" framing. */
  tradeoff: Localized
  /** Starting attribute bonuses. */
  bonus: Partial<Attributes>
  /** Multipliers applied during stat generation. */
  scoringBias: number
  playmakingBias: number
  defenseBias: number
  /** >1 means this style gets hurt more often. */
  injuryFactor: number
  /** >1 means faster hype accumulation (highlights sell). */
  hypeFactor: number
}

export type CareerStage =
  | 'youth'
  | 'breakout'
  | 'development'
  | 'draft'
  | 'prime'
  | 'veteran'
  | 'twilight'
  | 'retired'

export type LeagueTier =
  /** The very top: NBA. */
  | 1
  /** EuroLeague. */
  | 2
  /** Strong domestic first divisions: ACB, Lega A, Betclic, ABA, CBA, NBL, NBB, LNB. */
  | 3
  /** Second divisions, NCAA, developmental. */
  | 4
  /** Youth and academy basketball. */
  | 5

export interface League {
  id: string
  name: Localized
  /** Short label for tight UI (tables, share card). */
  abbr: string
  tier: LeagueTier
  country: string
  /** 0-100. Scales how hard it is to put up numbers and how much a title is worth. */
  prestige: number
  /** Games in a regular season — used for counting-stat totals. */
  gamesPerSeason: number
  /** Rough annual salary band in USD, [floor, star]. */
  salaryBand: [number, number]
  teamIds: string[]
  /** Awards this league hands out. */
  hasMvp: boolean
  hasAllStar: boolean
}

export interface Team {
  id: string
  name: Localized
  /** Short label, e.g. "LAL". */
  abbr: string
  leagueId: string
  city: string
  /** 0-100 roster strength. Drives team record and title odds independent of you. */
  strength: number
  /** 0-100. High-prestige clubs raise hype but demand more to keep your minutes. */
  prestige: number
  colors: [string, string]
}

export interface Country {
  code: string
  name: Localized
  flag: string
  /** 0-100. Deeper basketball countries get more scouting exposure and better national teams. */
  strength: number
  /** Which ladder this country's players climb. */
  path: CareerPathId
  domesticLeagueIds: string[]
  nationalTeam: Localized
  /** Which continental championship this country plays. */
  continental: 'americas' | 'europe' | 'africa' | 'asia' | 'oceania'
  /** Name pool used for teammates, rivals and coaches from this country. */
  namePoolId: string
}

export type CareerPathId =
  | 'usa_ncaa'
  | 'latam_club'
  | 'euro_academy'
  | 'oceania_nbl'
  | 'africa_academy'
  | 'asia_domestic'
  | 'generic'

/** A single simulated season's box score and context. */
export interface Season {
  /** In-fiction year, e.g. 2026. */
  year: number
  age: number
  stage: CareerStage
  teamId: string
  leagueId: string
  /** Role, which drives minutes. */
  role: PlayerRole
  gamesPlayed: number
  gamesMissed: number
  minutesPerGame: number
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fgPct: number
  threePct: number
  ftPct: number
  /** True shooting %, the honest efficiency number. */
  tsPct: number
  /** Composite 0-100 performance rating for the season. */
  rating: number
  teamWins: number
  teamLosses: number
  playoffResult: PlayoffResult
  awards: AwardId[]
  /** Salary earned this season, USD. */
  salary: number
  /** Injuries suffered this season. */
  injuries: InjuryRecord[]
  /** Narrative beats logged during the season, already localized at render time. */
  headlines: LocalizedHeadline[]
}

export type PlayerRole = 'star' | 'starter' | 'rotation' | 'bench' | 'prospect' | 'injured'

export type PlayoffResult =
  | 'champion'
  | 'finals'
  | 'conference_finals'
  | 'semifinals'
  | 'first_round'
  | 'missed'
  | 'none'

export type AwardId =
  | 'mvp'
  | 'finals_mvp'
  | 'roy'
  | 'dpoy'
  | 'sixth_man'
  | 'most_improved'
  | 'all_star'
  | 'all_league_first'
  | 'all_league_second'
  | 'all_defensive'
  | 'scoring_title'
  | 'assists_title'
  | 'rebounding_title'
  | 'league_champion'
  | 'cup_champion'
  | 'olympic_gold'
  | 'olympic_medal'
  | 'world_cup_gold'
  | 'world_cup_medal'
  | 'continental_gold'
  | 'continental_medal'

export interface InjuryRecord {
  id: string
  name: Localized
  /** Games missed. */
  severity: number
  /** Permanent attribute damage applied on occurrence. */
  permanentDamage: Partial<Attributes>
  /** Wear added. */
  wearAdded: number
}

export interface LocalizedHeadline {
  text: Localized
  tone: 'good' | 'bad' | 'neutral' | 'epic'
}

/** The career-long rival, simulated in parallel. */
export interface Rival {
  name: string
  countryCode: string
  position: Position
  /** Where they were met: same academy, same draft class, etc. */
  origin: Localized
  /** Cumulative career line. */
  totals: RivalTotals
  /** Per-year snapshot so the UI can chart you against them. */
  history: { year: number; ppg: number; rating: number; teamName: string }[]
  retired: boolean
  retirementYear: number | null
}

export interface RivalTotals {
  seasons: number
  points: number
  rebounds: number
  assists: number
  rings: number
  mvps: number
  allStars: number
  peakRating: number
}

/** Aggregated career numbers, recomputed from `seasons` — never stored as truth. */
export interface CareerTotals {
  seasons: number
  gamesPlayed: number
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  ppg: number
  rpg: number
  apg: number
  rings: number
  mvps: number
  finalsMvps: number
  allStars: number
  allLeague: number
  dpoys: number
  scoringTitles: number
  internationalGolds: number
  internationalMedals: number
  earnings: number
  peakRating: number
  teamsPlayedFor: number
  seasonsMissedToInjury: number
}

/** An event card. All player-facing text is bilingual by construction. */
export interface GameEvent {
  id: string
  /** Higher weight = drawn more often, before requirement filtering. */
  weight: number
  /** Which stages this card can appear in. */
  stages: CareerStage[]
  category: EventCategory
  /** Optional gate. Returning false removes the card from the deck this season. */
  requires?: (ctx: EventContext) => boolean
  /** Fire at most once per career. Defaults to true — repeats feel cheap. */
  once?: boolean
  title: Localized
  body: (ctx: EventContext) => Localized
  choices: EventChoice[]
}

export type EventCategory =
  | 'injury'
  | 'transfer'
  | 'coach'
  | 'media'
  | 'locker_room'
  | 'personal'
  | 'national'
  | 'rival'
  | 'business'
  | 'milestone'

export interface EventChoice {
  label: Localized
  /** Optional gate on the choice itself (can't demand a trade with no leverage). */
  available?: (ctx: EventContext) => boolean
  /** Resolve the choice. May roll dice via `ctx.rng`. Returns what happened. */
  resolve: (ctx: EventContext) => EventOutcome
}

export interface EventOutcome {
  text: Localized
  tone: 'good' | 'bad' | 'neutral' | 'epic'
  attributes?: Partial<Attributes>
  hidden?: Partial<HiddenStats>
  /** Money delta in USD. */
  money?: number
  /** Force a transfer to a specific team, or to a tier. */
  transferTo?: { teamId?: string; tier?: LeagueTier }
  /** Add an injury. */
  injury?: InjuryRecord
  /** End the career immediately (catastrophic injury, walking away). */
  retire?: boolean
}

/** Everything an event needs to decide whether it fires and what it does. */
export interface EventContext {
  player: Player
  season: Season | null
  team: Team
  league: League
  country: Country
  rival: Rival
  rng: Rng
  /** Seasons already completed. */
  seasonsPlayed: number
}

export interface Player {
  name: string
  countryCode: string
  number: number
  position: Position
  hand: Hand
  styleId: PlayStyleId
  /** Height in cm — derived from position at creation, shown in the profile. */
  heightCm: number
  age: number
  stage: CareerStage
  attributes: Attributes
  hidden: HiddenStats
  currentTeamId: string
  currentLeagueId: string
  /** Unspent preseason growth points, spent for the player by whichever perk they pick. */
  growthPoints: number
  /** Whether draft night has already happened. It only comes around once. */
  draftDone: boolean
  /** Perks acquired, in the order they were chosen. */
  perks: string[]
  /** The three on offer this preseason. Empty once one has been taken. */
  perkChoices: string[]
  /** Career earnings, USD. */
  earnings: number
  /** Ids of events already fired, so `once` cards stay once. */
  firedEventIds: string[]
  /** Teams played for, in order, for the loyalty/journeyman legacy modifiers. */
  teamHistory: string[]
  retired: boolean
  retirementYear: number | null
  /** Set when a catastrophic injury or a choice ends things early. */
  retirementReason: Localized | null
}

export type GameMode = 'career' | 'daily'

export interface GameState {
  mode: GameMode
  seed: string
  /** Current in-fiction year. */
  year: number
  player: Player
  rival: Rival
  seasons: Season[]
  /** The event awaiting a decision, if any. */
  pendingEvent: PendingEvent | null
  /**
   * Note explaining this preseason's move (transfer, draft, loan), set during
   * `beginSeason` and folded into the season's headlines once it is simulated.
   */
  pendingPlacementNote: Localized | null
  /**
   * A season that is fully simulated except for its final, held back while the
   * player plays for the title. Never present outside the `minigame` phase.
   */
  draftSeason: Season | null
  /** The final awaiting the player, if any. */
  pendingMinigame: MinigameChallenge | null
  /** Contracts on the table, when the player is choosing a club. */
  pendingOffers: ContractOffer[] | null
  /** Draft night, the one year it happens. */
  pendingDraft: DraftResult | null
  /** This summer's national team campaign. */
  pendingTournament: NationalTournament | null
  /** Phase within the season loop, so the UI knows what to render. */
  phase: GamePhase
  /** Version tag so old saves can be discarded rather than crash the app. */
  version: number
}

export type GamePhase =
  /** Draft night, for the one year it happens. */
  | 'draft'
  /** Choosing which club to sign for. */
  | 'offers'
  /** Picking this year's perk. */
  | 'preseason'
  | 'event'
  /** A final has been reached and is waiting on the player to actually win it. */
  | 'minigame'
  | 'season_result'
  /** Summer with the national team. */
  | 'national'
  | 'retirement'

export type MinigameType =
  | 'free_throw'
  | 'clutch_three'
  | 'defensive_stop'
  | 'fast_break'
  | 'play_recall'

/** What is being decided, which changes the stakes and the framing. */
export type CompetitionKind = 'league' | 'world_cup' | 'olympics' | 'continental'

/** A contract on the table during free agency. */
export interface ContractOffer {
  teamId: string
  leagueId: string
  /** The role the club is selling you. Not a guarantee — you still have to earn minutes. */
  role: PlayerRole
  /** Annual salary in USD. */
  salary: number
  years: number
  /** The club's pitch, in their words. */
  pitch: Localized
  /** Whether this is a renewal at your current club. */
  isCurrentClub: boolean
}

/** Draft night. */
export interface DraftResult {
  /** Where scouts had you going, shown before the picks start. */
  projectedRange: [number, number]
  /** Where you actually went, or null if nobody called. */
  pick: number | null
  teamId: string | null
  /** Names off the board before you, purely for the theatre of it. */
  precedingPicks: { pick: number; name: string; teamAbbr: string }[]
  /** Where you land instead when undrafted. */
  fallbackTeamId: string
  fallbackLeagueId: string
}

/** A summer with the national team. */
export interface NationalTournament {
  kind: Exclude<CompetitionKind, 'league'>
  name: Localized
  year: number
  /** How far the run got before the final. */
  outcome: 'group' | 'quarterfinal' | 'semifinal' | 'bronze' | 'final'
  /** Who is waiting in the final, if you got there. */
  opponent: Localized | null
  /** Medals earned. Resolved after the final if one is played. */
  awards: AwardId[]
  /** Narrative line for the run so far. */
  summary: Localized
}

/**
 * A playable final. The outcome is an *input* to the simulation, not an RNG
 * draw — which is what keeps a seed reproducible (same seed + same decisions +
 * same minigame results → same career) while still letting skill decide titles.
 */
export interface MinigameChallenge {
  type: MinigameType
  /** How many attempts the player gets. */
  rounds: number
  /** How many of those attempts must succeed to win the title. */
  required: number
  /** 0 (trivial) to 1 (brutal). Drives target sizes and speeds. */
  difficulty: number
  title: Localized
  intro: Localized
  /** What is on the line, named explicitly. */
  stake: Localized
  /** Which competition this decides. Drives the framing and the reward. */
  competition: CompetitionKind
  /** Opponent club, for flavour on the minigame screen. Null for national teams. */
  opponentTeamId: string | null
  /** Opponent name when there is no club crest to show. */
  opponentName: Localized
}

export interface PendingEvent {
  eventId: string
  /** Pre-resolved localized text, so re-renders don't re-roll dice. */
  title: Localized
  body: Localized
  choices: { index: number; label: Localized }[]
  /** Set once the player picks, so the outcome can be shown before advancing. */
  outcome: EventOutcome | null
}

/** Final verdict rendered on the retirement screen and the share card. */
export interface Legacy {
  score: number
  tier: LegacyTier
  title: Localized
  blurb: Localized
  hallOfFame: boolean
  jerseyRetired: boolean
  /** Beat the rival? */
  beatRival: boolean
  highlights: Localized[]
}

export type LegacyTier =
  | 'goat'
  | 'legend'
  | 'hall_of_famer'
  | 'star'
  | 'solid_pro'
  | 'journeyman'
  | 'cautionary_tale'

/** A completed career kept in the local archive. */
export interface ArchivedCareer {
  seed: string
  mode: GameMode
  playerName: string
  countryCode: string
  number: number
  position: Position
  totals: CareerTotals
  legacy: Legacy
  /** Epoch ms, stamped when archived. */
  completedAt: number
}
