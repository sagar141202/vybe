export const EMPTY_STATES = {
  search: {
    emoji: '🔍',
    title: 'Search for music',
    subtitle: 'Type a song, artist or album name to get started',
  },
  searchNoResults: (query: string) => ({
    emoji: '🎭',
    title: `No results for "${query}"`,
    subtitle: 'Try different keywords or browse by mood below',
    actionLabel: 'Clear search',
  }),
  library: {
    emoji: '🎵',
    title: 'Your library is empty',
    subtitle: 'Start listening to build your personal collection',
    actionLabel: 'Discover Music',
  },
  liked: {
    emoji: '🤍',
    title: 'No liked songs yet',
    subtitle: 'Tap ❤️ on any track to save it here',
    actionLabel: 'Find Music',
  },
  recent: {
    emoji: '🕐',
    title: 'Nothing played yet',
    subtitle: 'Your listening history will appear here after you play some tracks',
    actionLabel: 'Start Listening',
  },
  downloads: {
    emoji: '📭',
    title: 'No downloads yet',
    subtitle: 'Tap ⬇️ in the Full Player to save tracks for offline listening',
    actionLabel: 'Browse Music',
  },
  playlists: {
    emoji: '🎼',
    title: 'No playlists yet',
    subtitle: 'Create your first playlist to organise your favourite music',
    actionLabel: 'Create Playlist',
  },
  queue: {
    emoji: '📋',
    title: 'Queue is empty',
    subtitle: 'Play some music to see your queue here',
    actionLabel: 'Search Music',
  },
  dailyMix: {
    emoji: '🤖',
    title: 'Daily Mix not ready',
    subtitle: 'Play more music to generate your personalised Daily Mix',
    actionLabel: 'Start Listening',
  },
  vibeSearch: {
    emoji: '🔮',
    title: 'Describe a vibe',
    subtitle: 'Try "rainy night lo-fi" or "pump up workout" to find matching tracks',
  },
  vibeNoResults: (query: string) => ({
    emoji: '🎭',
    title: 'No vibes found',
    subtitle: `Couldn't find tracks matching "${query}". Try a different description.`,
    actionLabel: 'Try Again',
  }),
  collab: {
    emoji: '🎵',
    title: 'No one here yet',
    subtitle: 'Share the room code with friends to listen together',
  },
  artist: (name: string) => ({
    emoji: '🎤',
    title: 'No tracks found',
    subtitle: `Couldn't find tracks for "${name}". Try searching directly.`,
    actionLabel: 'Search Instead',
  }),
  album: {
    emoji: '💿',
    title: 'Album is empty',
    subtitle: 'No tracks available for this album',
  },
};
