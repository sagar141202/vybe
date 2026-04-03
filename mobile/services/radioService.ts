import { api } from '../lib/api';
import type { Track } from '../stores/playerStore';

interface SimilarityScore {
  track: Track;
  score: number;
  reasons: string[];
}

// Cache for similar tracks to avoid repeated API calls
const radioCache = new Map<string, { tracks: Track[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Calculate Jaccard similarity between two strings (for title/artist matching)
 */
function jaccardSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.toLowerCase().split(/\s+/));
  const set2 = new Set(str2.toLowerCase().split(/\s+/));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

/**
 * Calculate artist similarity score
 * - Same primary artist: high score
 * - Similar artist name: medium score
 * - Different artists: lower score
 */
function calculateArtistScore(seed: Track, candidate: Track): number {
  const seedArtists = seed.artist.toLowerCase().split(/[,&\+]|featuring|feat|ft\./i).map(s => s.trim());
  const candidateArtists = candidate.artist.toLowerCase().split(/[,&\+]|featuring|feat|ft\./i).map(s => s.trim());

  // Check for exact artist match
  for (const sa of seedArtists) {
    for (const ca of candidateArtists) {
      if (sa === ca || ca.includes(sa) || sa.includes(ca)) {
        return 1.0;
      }
    }
  }

  // Partial match using Jaccard
  const artistSim = jaccardSimilarity(seed.artist, candidate.artist);
  return Math.min(artistSim * 2, 0.7); // Cap at 0.7 for non-exact matches
}

/**
 * Calculate title similarity score
 * - Similar words in title get points
 * - Same genre/style indicators (remix, acoustic, etc.) get bonus
 */
function calculateTitleScore(seed: Track, candidate: Track): number {
  const seedTitle = seed.title.toLowerCase();
  const candTitle = candidate.title.toLowerCase();

  // Extract common music keywords
  const keywords = [
    'remix', 'acoustic', 'cover', 'live', 'version', 'edit',
    'instrumental', 'karaoke', 'mashup', 'bootleg', 'extended',
    'radio', 'original', 'mix', 'feat', 'ft'
  ];

  let score = jaccardSimilarity(seed.title, candidate.title) * 0.5;

  // Bonus if both have same keyword
  for (const kw of keywords) {
    const seedHas = seedTitle.includes(kw);
    const candHas = candTitle.includes(kw);
    if (seedHas && candHas) {
      score += 0.15;
    }
  }

  // Penalize if one is a remix and other isn't (usually different vibe)
  const seedRemix = seedTitle.includes('remix');
  const candRemix = candTitle.includes('remix');
  if (seedRemix !== candRemix) {
    score -= 0.1;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate tempo/BPM similarity
 */
function calculateTempoScore(seed: Track, candidate: Track): number {
  if (!seed.bpm || !candidate.bpm) return 0.5; // Neutral if unknown

  const bpmDiff = Math.abs(seed.bpm - candidate.bpm);

  // Within 5 BPM is excellent
  if (bpmDiff <= 5) return 1.0;
  // Within 10 BPM is good
  if (bpmDiff <= 10) return 0.8;
  // Within 20 BPM is okay
  if (bpmDiff <= 20) return 0.6;
  // Within 30 BPM is acceptable
  if (bpmDiff <= 30) return 0.4;
  // Too different
  return 0.2;
}

/**
 * Calculate genre/style similarity based on audio features
 */
function calculateFeatureScore(seed: Track, candidate: Track): number {
  if (!seed.energy && !candidate.energy) return 0.5;

  const scores: number[] = [];

  // Energy similarity (0-1 range)
  if (seed.energy != null && candidate.energy != null) {
    const energyDiff = Math.abs(seed.energy - candidate.energy);
    scores.push(1 - energyDiff);
  }

  // Danceability similarity
  if (seed.danceability != null && candidate.danceability != null) {
    const danceDiff = Math.abs(seed.danceability - candidate.danceability);
    scores.push(1 - danceDiff);
  }

  // Valence (mood) similarity
  if (seed.valence != null && candidate.valence != null) {
    const valenceDiff = Math.abs(seed.valence - candidate.valence);
    scores.push(1 - valenceDiff);
  }

  // Key matching bonus
  if (seed.key && candidate.key && seed.key === candidate.key) {
    scores.push(1.0);
  }

  return scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0.5;
}

/**
 * Calculate overall similarity score between two tracks
 */
function calculateSimilarity(seed: Track, candidate: Track): SimilarityScore {
  const reasons: string[] = [];

  // Artist match (highest weight - 40%)
  const artistScore = calculateArtistScore(seed, candidate);
  if (artistScore > 0.8) reasons.push('Same artist');
  else if (artistScore > 0.5) reasons.push('Similar artist');

  // Title similarity (15%)
  const titleScore = calculateTitleScore(seed, candidate);
  if (titleScore > 0.5) reasons.push('Similar style');

  // Tempo match (25%)
  const tempoScore = calculateTempoScore(seed, candidate);
  if (tempoScore > 0.8 && seed.bpm && candidate.bpm) {
    reasons.push(`Similar tempo (${Math.round(candidate.bpm)} BPM)`);
  }

  // Audio features (20%)
  const featureScore = calculateFeatureScore(seed, candidate);
  if (featureScore > 0.8) reasons.push('Similar vibe');

  // Calculate weighted score
  const score =
    artistScore * 0.40 +
    titleScore * 0.15 +
    tempoScore * 0.25 +
    featureScore * 0.20;

  // Boost score if multiple strong matches
  let finalScore = score;
  if (artistScore > 0.7 && tempoScore > 0.7) finalScore += 0.1;
  if (artistScore > 0.7 && featureScore > 0.7) finalScore += 0.05;

  return {
    track: candidate,
    score: Math.min(1, finalScore),
    reasons: reasons.length > 0 ? reasons : ['Recommended'],
  };
}

/**
 * Diversify results to avoid too many songs from same artist
 */
function diversifyResults(scored: SimilarityScore[], maxPerArtist: number = 2): Track[] {
  const artistCounts = new Map<string, number>();
  const result: Track[] = [];

  // Sort by score descending
  const sorted = [...scored].sort((a, b) => b.score - a.score);

  for (const item of sorted) {
    const primaryArtist = item.track.artist.split(/[,&]/)[0].trim();
    const count = artistCounts.get(primaryArtist) || 0;

    if (count < maxPerArtist) {
      result.push(item.track);
      artistCounts.set(primaryArtist, count + 1);
    }

    // Stop when we have enough
    if (result.length >= 20) break;
  }

  return result;
}

/**
 * Fetch radio tracks with smart recommendations
 * This is the main entry point for autoplay
 */
export async function fetchRadioTracks(
  seedTrack: Track,
  options: {
    limit?: number;
    diversify?: boolean;
    excludeIds?: string[];
  } = {}
): Promise<Track[]> {
  const { limit = 10, diversify = true, excludeIds = [] } = options;

  // Check cache
  const cacheKey = seedTrack.video_id;
  const cached = radioCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // Filter out excluded IDs and already queued tracks
    const filtered = cached.tracks.filter(
      t => !excludeIds.includes(t.video_id)
    );
    if (filtered.length >= limit) {
      return filtered.slice(0, limit);
    }
  }

  console.log('Radio: fetching smart recommendations for', seedTrack.title);

  try {
    // Try multiple sources for candidates
    const candidates: Track[] = [];

    // 1. Get similar tracks from backend (uses Annoy index + user vector)
    try {
      const { data: similar } = await api.get('/recommendations/similar', {
        params: { limit: 50 },
      });
      if (similar && Array.isArray(similar)) {
        candidates.push(...similar);
      }
    } catch (e) {
      console.log('Radio: similar endpoint failed, falling back');
    }

    // 2. Search for same artist tracks
    try {
      const { data: artistTracks } = await api.get('/search', {
        params: {
          q: seedTrack.artist,
          limit: 20,
        },
      });
      if (artistTracks && Array.isArray(artistTracks)) {
        candidates.push(...artistTracks);
      }
    } catch (e) {
      // Ignore
    }

    // 3. Search for genre/style based on title keywords
    const titleKeywords = seedTrack.title
      .toLowerCase()
      .replace(/\([^)]*\)/g, '') // Remove parentheses
      .replace(/[^\w\s]/g, ' ') // Replace special chars
      .split(/\s+/)
      .filter(w => w.length > 3 && !['this', 'that', 'with', 'from', 'have', 'been'].includes(w))
      .slice(0, 3)
      .join(' ');

    if (titleKeywords) {
      try {
        const { data: keywordTracks } = await api.get('/search', {
          params: {
            q: `${seedTrack.artist} ${titleKeywords}`,
            limit: 15,
          },
        });
        if (keywordTracks && Array.isArray(keywordTracks)) {
          candidates.push(...keywordTracks);
        }
      } catch (e) {
        // Ignore
      }
    }

    // Remove duplicates and excluded tracks
    const seen = new Set([seedTrack.video_id, ...excludeIds]);
    const uniqueCandidates: Track[] = [];

    for (const track of candidates) {
      if (!seen.has(track.video_id)) {
        seen.add(track.video_id);
        uniqueCandidates.push(track);
      }
    }

    if (uniqueCandidates.length === 0) {
      console.log('Radio: no candidates found');
      return [];
    }

    // Score all candidates
    const scored = uniqueCandidates.map(candidate =>
      calculateSimilarity(seedTrack, candidate)
    );

    // Filter out low-quality matches
    const qualityScored = scored.filter(s => s.score > 0.3);

    // Sort and diversify
    let result: Track[];
    if (diversify) {
      result = diversifyResults(qualityScored, 2);
    } else {
      result = qualityScored
        .sort((a, b) => b.score - a.score)
        .map(s => s.track);
    }

    // Cache results
    radioCache.set(cacheKey, {
      tracks: result,
      timestamp: Date.now(),
    });

    console.log(`Radio: selected ${Math.min(result.length, limit)} tracks from ${uniqueCandidates.length} candidates`);
    return result.slice(0, limit);

  } catch (error: any) {
    console.error('Radio error:', error?.message);
    return [];
  }
}

/**
 * Get a single next track recommendation
 * Used when queue runs out
 */
export async function getNextRadioTrack(
  seedTrack: Track,
  recentlyPlayedIds: string[] = []
): Promise<Track | null> {
  const tracks = await fetchRadioTracks(seedTrack, {
    limit: 1,
    excludeIds: [seedTrack.video_id, ...recentlyPlayedIds],
  });
  return tracks[0] || null;
}

/**
 * Pre-fetch radio tracks for smoother autoplay
 */
export async function prefetchRadioTracks(seedTrack: Track): Promise<void> {
  const cacheKey = seedTrack.video_id;
  const cached = radioCache.get(cacheKey);

  if (!cached || Date.now() - cached.timestamp > CACHE_TTL) {
    await fetchRadioTracks(seedTrack, { limit: 20 });
  }
}

/**
 * Clear radio cache
 */
export function clearRadioCache(): void {
  radioCache.clear();
}
