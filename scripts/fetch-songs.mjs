import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, '../src/data/songs.json');

// Explicit Apple Music / iTunes collection IDs for all Viktor Sheen & BUKA studio albums / EPs
const STUDIO_ALBUM_COLLECTION_IDS = [
  1852064920, // BUKA - Já, mé druhé já a Kristýna (17)
  1774287799, // Viktor Sheen - Impostor syndrom (12)
  1711135571, // Viktor Sheen - Planeta opic (15)
  1667500249, // Calin & Viktor Sheen - ROADTRIP (12)
  1594405160, // Viktor Sheen - Příběhy a sny (16)
  1535027932, // Viktor Sheen - Barvy (16)
  1603464489, // Viktor Sheen - Černobílej svět (15)
  1415525325, // Sheen & Jickson - Grál (13)
  1276025459, // Viktor Sheen - Jungler (13)
  1163618879, // Viktor Sheen - NSD (16)
  1008368655, // Viktor Sheen & Renne Dang - Projekt Asia (15)
  1163618803, // Viktor Sheen - Level Up (EP)
];

const SEARCH_URLS = [
  `https://itunes.apple.com/lookup?id=${STUDIO_ALBUM_COLLECTION_IDS.slice(0, 6).join(',')}&entity=song&country=cz&limit=200`,
  `https://itunes.apple.com/lookup?id=${STUDIO_ALBUM_COLLECTION_IDS.slice(6).join(',')}&entity=song&country=cz&limit=200`,
  'https://itunes.apple.com/search?term=Viktor+Sheen&entity=song&country=cz&limit=200',
  'https://itunes.apple.com/search?term=feat.+Viktor+Sheen&entity=song&country=cz&limit=200',
  'https://itunes.apple.com/search?term=Buka+Kristyna&entity=song&country=cz&limit=200',
  'https://itunes.apple.com/search?term=Lil+Buca+Near&entity=song&country=cz&limit=200',
];

// Viktor Sheen's own studio albums and joint albums (NOT marked as "Feat")
const MAIN_OR_JOINT_ALBUMS = new Set([
  'impostor syndrom',
  'planeta opic',
  'roadtrip',
  'pribehy a sny',
  'barvy',
  'cernobilej svet',
  'gral',
  'jungler',
  'nsd',
  'projekt asia',
  'level up',
  'ja, me druhe ja a kristyna',
]);

function stripDiacritics(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function normalizeTitleForDedup(title) {
  return stripDiacritics(title)
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

function isMainStudioAlbum(collectionName) {
  const norm = stripDiacritics(collectionName || '')
    .replace(/\s*\(singl\)$/i, '')
    .replace(/\s*-\s*(single|ep)$/i, '')
    .trim();
  for (const album of MAIN_OR_JOINT_ALBUMS) {
    if (norm === album || norm.includes(album)) return true;
  }
  return false;
}

function isBukaTrack(item) {
  const artistNorm = stripDiacritics(item.artistName);
  const titleNorm = stripDiacritics(item.trackName);
  const collectionNorm = stripDiacritics(item.collectionName);
  if (collectionNorm.includes('ja, me druhe ja a kristyna')) return true;
  if (artistNorm.includes('lil buca near') || titleNorm.includes('lil buca near')) return true;
  const artists = artistNorm.split(/[,&]/).map((s) => s.trim());
  if (
    (artists.includes('buka') || titleNorm.includes('feat. buka') || titleNorm.includes('ft. buka')) &&
    (collectionNorm.includes('kristyna') || (item.releaseDate && item.releaseDate >= '2024-01-01'))
  ) {
    return true;
  }
  return false;
}

function isSheenTrack(item) {
  const artistNorm = stripDiacritics(item.artistName);
  const titleNorm = stripDiacritics(item.trackName);
  const collectionNorm = stripDiacritics(item.collectionName);
  return (
    artistNorm.includes('viktor sheen') ||
    artistNorm.includes('sheen & jickson') ||
    artistNorm.includes('jickson & sheen') ||
    (artistNorm.includes('sheen') && collectionNorm.includes('gral')) ||
    titleNorm.includes('viktor sheen')
  );
}

function isViktorFeat(track) {
  if (isMainStudioAlbum(track.collectionName)) {
    return false;
  }

  const artistNorm = stripDiacritics(track.artistName || '');
  const titleNorm = stripDiacritics(track.trackName || '');

  if (
    titleNorm.includes('feat. viktor sheen') ||
    titleNorm.includes('ft. viktor sheen') ||
    titleNorm.includes('feat. buka') ||
    titleNorm.includes('feat. lil buca near')
  ) {
    return true;
  }

  if (
    artistNorm === 'viktor sheen' ||
    artistNorm === 'buka' ||
    artistNorm.startsWith('viktor sheen &')
  ) {
    return false;
  }

  return true;
}

function isSingleOrEP(track) {
  const col = track.collectionName || '';
  if (isMainStudioAlbum(col)) return false;
  return /\(singl\)$/i.test(col) || /-\s*(single|ep)$/i.test(col) || (track.trackCount && track.trackCount <= 2);
}

function isAlbumPreferred(candidate, existing) {
  const candLive = isLiveRecording(candidate);
  const existLive = isLiveRecording(existing);
  if (!candLive && existLive) return true;
  if (candLive && !existLive) return false;

  const candIsSingle = isSingleOrEP(candidate);
  const existIsSingle = isSingleOrEP(existing);

  if (!candIsSingle && existIsSingle) return true;
  if (candIsSingle && !existIsSingle) return false;

  const candMain = isMainStudioAlbum(candidate.collectionName);
  const existMain = isMainStudioAlbum(existing.collectionName);
  if (candMain && !existMain) return true;
  if (!candMain && existMain) return false;

  if ((candidate.trackCount || 0) !== (existing.trackCount || 0)) {
    return (candidate.trackCount || 0) > (existing.trackCount || 0);
  }

  const candDate = new Date(candidate.releaseDate || '2099-01-01').getTime();
  const existDate = new Date(existing.releaseDate || '2099-01-01').getTime();
  return candDate < existDate;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJsonWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      console.warn(`HTTP ${res.status} for ${url} (attempt ${attempt}/${retries})`);
    } catch (e) {
      console.warn(`Error fetching ${url}: ${e.message}`);
    }
    await sleep(1000 * attempt);
  }
  return { results: [] };
}

async function main() {
  console.log('Stahuji kompletní diskografii Viktora Sheena + BUKA z iTunes API...');
  const allRawResults = [];

  // Load existing songs.json as baseline so we never lose tracks if iTunes throttles a request
  try {
    const existingRaw = await fs.readFile(OUTPUT_PATH, 'utf-8');
    const existingSongs = JSON.parse(existingRaw);
    for (const s of existingSongs) {
      allRawResults.push({
        wrapperType: 'track',
        kind: 'song',
        trackId: s.id,
        trackName: s.title,
        artistName: s.artist,
        collectionName: s.album,
        releaseDate: `${s.releaseYear}-01-01T00:00:00Z`,
        artworkUrl100: s.artworkUrl,
        previewUrl: s.previewUrl,
        trackViewUrl: s.trackViewUrl,
        trackCount: isMainStudioAlbum(s.album) ? 15 : 1,
      });
    }
    console.log(`Načteno ${existingSongs.length} existujících skladeb jako základ.`);
  } catch {
    // ignore if file does not exist
  }

  for (const url of SEARCH_URLS) {
    const data = await fetchJsonWithRetry(url);
    if (Array.isArray(data.results)) {
      console.log(`URL vrátil ${data.results.length} položek: ${url}`);
      for (const item of data.results) {
        if (item.wrapperType === 'track') {
          allRawResults.push(item);
        }
      }
    }
    await sleep(600);
  }

  // Filter valid Viktor Sheen & BUKA studio tracks
  const validTracks = allRawResults.filter((item) => {
    if (item.wrapperType !== 'track' || item.kind !== 'song') return false;
    if (!item.previewUrl || !item.trackName || !item.artistName) return false;

    if (!isSheenTrack(item) && !isBukaTrack(item)) return false;
    if (isLiveRecording(item)) return false;

    const titleLower = item.trackName.toLowerCase();
    const artistLower = (item.artistName || '').toLowerCase();
    const collectionLower = (item.collectionName || '').toLowerCase();
    if (
      titleLower.includes('karaoke') ||
      titleLower.includes('instrumental version') ||
      titleLower.includes('(cover)') ||
      titleLower.endsWith('cover') ||
      artistLower === 'laion' ||
      artistLower === 'diedope' ||
      (titleLower.includes('safír') && collectionLower.includes('karantena'))
    ) {
      return false;
    }

    return true;
  });

  const byTrackId = new Map();
  for (const track of validTracks) {
    byTrackId.set(track.trackId, track);
  }

  // Group by normalized title first
  const byNormTitle = new Map();
  for (const track of byTrackId.values()) {
    const normTitle = normalizeTitleForDedup(track.trackName);
    if (!normTitle) continue;
    if (!byNormTitle.has(normTitle)) {
      byNormTitle.set(normTitle, []);
    }
    byNormTitle.get(normTitle).push(track);
  }

  const finalTracks = [];
  for (const [, candidates] of byNormTitle.entries()) {
    const byMainAlbum = new Map();
    const others = [];
    for (const c of candidates) {
      if (isMainStudioAlbum(c.collectionName)) {
        const colKey = stripDiacritics(c.collectionName || '')
          .replace(/\s*\(singl\)$/i, '')
          .replace(/\s*-\s*(single|ep)$/i, '')
          .trim();
        if (!byMainAlbum.has(colKey) || isAlbumPreferred(c, byMainAlbum.get(colKey))) {
          byMainAlbum.set(colKey, c);
        }
      } else {
        others.push(c);
      }
    }

    if (byMainAlbum.size > 0) {
      // Keep one entry per distinct main studio album (e.g. "V pekle" on Černobílej svět AND "V pekle" on Barvy)
      for (const albumTrack of byMainAlbum.values()) {
        finalTracks.push(albumTrack);
      }
      // Also check if there is a guest feature by ANOTHER artist that happens to share the title (e.g. Koky - SOS vs Viktor Sheen - SOS)
      for (const other of others) {
        if (isViktorFeat(other)) {
          finalTracks.push(other);
        }
      }
    } else if (others.length > 0) {
      let best = others[0];
      for (let i = 1; i < others.length; i++) {
        if (isAlbumPreferred(others[i], best)) {
          best = others[i];
        }
      }
      finalTracks.push(best);
    }
  }

  const formattedSongs = finalTracks
    .map((track) => {
      const releaseYear = track.releaseDate
        ? new Date(track.releaseDate).getFullYear()
        : 2020;

      const highResArtwork = (track.artworkUrl100 || '')
        .replace(/100x100bb\.jpg$/i, '600x600bb.jpg')
        .replace(/100x100/g, '600x600');

      const cleanAlbum = (track.collectionName || 'Singl')
        .replace(/\s*-\s*Single$/i, ' (Singl)')
        .replace(/\s*-\s*EP$/i, '');

      const isFeat = isViktorFeat(track);

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
        isFeat,
      };
    })
    .sort((a, b) => {
      if (b.releaseYear !== a.releaseYear) return b.releaseYear - a.releaseYear;
      if (a.album !== b.album) return a.album.localeCompare(b.album, 'cs');
      return a.title.localeCompare(b.title, 'cs');
    });

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(formattedSongs, null, 2), 'utf-8');

  const featCount = formattedSongs.filter((s) => s.isFeat).length;
  console.log(
    `Hotovo! Uloženo ${formattedSongs.length} skladeb (z toho ${featCount} featů) do ${OUTPUT_PATH}`
  );
}

main().catch((err) => {
  console.error('Chyba při generování databáze písniček:', err);
  process.exit(1);
});
