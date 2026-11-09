import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, '../src/data/songs.json');

const SEARCH_URLS = [
  'https://itunes.apple.com/search?term=Viktor+Sheen&entity=song&country=cz&limit=200',
  'https://itunes.apple.com/search?term=Calin+Viktor+Sheen&entity=song&country=cz&limit=200',
];

function normalizeTitleForDedup(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*\((feat\.|ft\.|with)[^)]*\)/gi, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function isLiveRecording(track) {
  const title = (track.trackName || '').toLowerCase();
  const collection = (track.collectionName || '').toLowerCase();
  return (
    collection.includes('live @') ||
    collection.includes('live at') ||
    title.includes('live 2024') ||
    title.includes('(live)')
  );
}

function isAlbumPreferred(candidate, existing) {
  const candLive = isLiveRecording(candidate);
  const existLive = isLiveRecording(existing);
  if (!candLive && existLive) return true;
  if (candLive && !existLive) return false;

  const candCollection = candidate.collectionName || '';
  const existCollection = existing.collectionName || '';

  const candIsSingle =
    /-\s*(single|ep)$/i.test(candCollection) ||
    (candidate.trackCount && candidate.trackCount <= 2);
  const existIsSingle =
    /-\s*(single|ep)$/i.test(existCollection) ||
    (existing.trackCount && existing.trackCount <= 2);

  if (!candIsSingle && existIsSingle) return true;
  if (candIsSingle && !existIsSingle) return false;

  if ((candidate.trackCount || 0) !== (existing.trackCount || 0)) {
    return (candidate.trackCount || 0) > (existing.trackCount || 0);
  }

  const candDate = new Date(candidate.releaseDate || '2099-01-01').getTime();
  const existDate = new Date(existing.releaseDate || '2099-01-01').getTime();
  return candDate < existDate;
}

async function main() {
  console.log('Stahuji diskografii Viktora Sheena z iTunes Search API...');
  const allRawResults = [];

  for (const url of SEARCH_URLS) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Chyba při stahování ${url}: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    if (Array.isArray(data.results)) {
      allRawResults.push(...data.results);
    }
  }

  // Lookup full catalog by Viktor Sheen's actual artistId + ROADTRIP collectionId
  const sheenArtist = allRawResults.find(
    (r) =>
      r.artistName &&
      r.artistName.toLowerCase().trim() === 'viktor sheen' &&
      r.artistId
  );
  const roadtripTrack = allRawResults.find(
    (r) =>
      r.collectionName &&
      r.collectionName.toLowerCase().trim() === 'roadtrip' &&
      r.collectionId
  );

  const lookupIds = [sheenArtist?.artistId, roadtripTrack?.collectionId].filter(Boolean);
  if (lookupIds.length > 0) {
    const lookupUrl = `https://itunes.apple.com/lookup?id=${lookupIds.join(',')}&entity=song&country=cz&limit=200`;
    const res = await fetch(lookupUrl);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results)) {
        allRawResults.push(...data.results);
      }
    }
  }

  // Filter valid Viktor Sheen studio tracks
  const validTracks = allRawResults.filter((item) => {
    if (item.wrapperType !== 'track' || item.kind !== 'song') return false;
    if (!item.previewUrl || !item.trackName || !item.artistName) return false;

    const artistLower = item.artistName.toLowerCase();
    if (!artistLower.includes('viktor sheen')) return false;

    if (isLiveRecording(item)) return false;

    const titleLower = item.trackName.toLowerCase();
    if (titleLower.includes('karaoke') || titleLower.includes('instrumental version')) {
      return false;
    }

    return true;
  });

  const byTrackId = new Map();
  for (const track of validTracks) {
    if (!byTrackId.has(track.trackId)) {
      byTrackId.set(track.trackId, track);
    }
  }

  const byNormalizedTitle = new Map();
  for (const track of byTrackId.values()) {
    const key = normalizeTitleForDedup(track.trackName);
    if (!key) continue;

    if (!byNormalizedTitle.has(key)) {
      byNormalizedTitle.set(key, track);
    } else {
      const existing = byNormalizedTitle.get(key);
      if (isAlbumPreferred(track, existing)) {
        byNormalizedTitle.set(key, track);
      }
    }
  }

  const formattedSongs = Array.from(byNormalizedTitle.values())
    .map((track) => {
      const releaseYear = track.releaseDate
        ? new Date(track.releaseDate).getFullYear()
        : 2020;

      const highResArtwork = (track.artworkUrl100 || '')
        .replace(/100x100bb\.jpg$/i, '600x600bb.jpg')
        .replace(/100x100/g, '600x600');

      const cleanAlbum = (track.collectionName || 'Singl')
        .replace(/\s*-\s*Single$/i, ' (Singl)');

      return {
        id: track.trackId,
        title: track.trackName.trim(),
        artist: track.artistName.trim(),
        album: cleanAlbum.trim(),
        releaseYear,
        artworkUrl: highResArtwork,
        previewUrl: track.previewUrl,
        trackViewUrl:
          track.trackViewUrl ||
          'https://music.apple.com/cz/artist/viktor-sheen/978137317',
      };
    })
    .sort((a, b) => {
      if (b.releaseYear !== a.releaseYear) return b.releaseYear - a.releaseYear;
      if (a.album !== b.album) return a.album.localeCompare(b.album, 'cs');
      return a.title.localeCompare(b.title, 'cs');
    });

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(formattedSongs, null, 2), 'utf-8');

  console.log(
    `Hotovo! Uloženo ${formattedSongs.length} unikátních skladeb do ${OUTPUT_PATH}`
  );
}

main().catch((err) => {
  console.error('Chyba při generování databáze písniček:', err);
  process.exit(1);
});
