// ============================================================
// SHARED CONSTANTS - Kanda Data
// Used by books.js and any other module that needs Kanda info
// ============================================================

/**
 * Complete Kanda metadata: file names, display names, chapter counts,
 * directory prefixes, and chapter file naming patterns.
 */
const KANDA_DATA = [
    {
        file: 'Bala_Srga.html',
        name: 'बालकाण्डः',
        chapters: 77,
        prefix: '../BALAKANDA/',
        pattern: 'sarga_'
    },
    {
        file: 'Ay_Sarga.html',
        name: 'अयोध्याकाण्डः',
        chapters: 119,
        prefix: '../AYODHYA KANDA/',
        pattern: 'Asarga_'
    },
    {
        file: 'Ara_sarga.html',
        name: 'अरण्यकाण्डः',
        chapters: 75,
        prefix: '../ARANAYKANDA/',
        pattern: 'Ar_sarga_'
    },
    {
        file: 'KIs_Sraga.html',
        name: 'किष्किन्धाकाण्डः',
        chapters: 67,
        prefix: '../KISHKINDHAKANDA/',
        pattern: 'ki_sarga_'
    },
    {
        file: 'SU_Sraga.html',
        name: 'सुन्दरकाण्डः',
        chapters: 68,
        prefix: '../SUNDARAKANDA/',
        pattern: 'Su_sarga_'
    },
    {
        file: 'YU_Sarga.html',
        name: 'युद्धकाण्डः',
        chapters: 128,
        prefix: '../YUDHAKANDA/',
        pattern: 'Yu_sarga_'
    },
    {
        file: 'utt_sarga.html',
        name: 'उत्तरकाण्डः',
        chapters: 111,
        prefix: '../UTTARAKANDA/',
        pattern: 'utt_sarga_'
    }
];

/**
 * Lookup helpers built from KANDA_DATA.
 * These are created once and reused, eliminating duplicated maps.
 */

/** Map: kandaFile -> kanda name (Devanagari) */
const kandaNameMap = Object.fromEntries(
    KANDA_DATA.map(k => [k.file, k.name])
);

/** Map: kandaFile -> chapter count */
const kandaChapterCountMap = Object.fromEntries(
    KANDA_DATA.map(k => [k.file, k.chapters])
);

/** Map: kandaFile -> { prefix, pattern } */
const kandaInfoMap = Object.fromEntries(
    KANDA_DATA.map(k => [k.file, { prefix: k.prefix, pattern: k.pattern }])
);

/** Array of kanda file names for quick iteration */
const KANDA_FILES = KANDA_DATA.map(k => k.file);

/**
 * Get the current Kanda filename from the URL path.
 * @returns {string} The matched kanda filename, or 'Bala_Srga.html' as default.
 */
function getCurrentKandaFile() {
    const currentPath = window.location.pathname;
    const fileName = currentPath.split('/').pop();
    return KANDA_FILES.includes(fileName) ? fileName : 'Bala_Srga.html';
}

/**
 * Get chapter count for a given Kanda file.
 * @param {string} kandaFile - The Kanda filename (e.g. 'Bala_Srga.html')
 * @returns {number} Number of chapters
 */
function getChapterCount(kandaFile) {
    return kandaChapterCountMap[kandaFile] || 77;
}

/**
 * Get directory prefix and file pattern for a given Kanda file.
 * @param {string} kandaFile - The Kanda filename
 * @returns {{ prefix: string, pattern: string }}
 */
function getKandaInfo(kandaFile) {
    return kandaInfoMap[kandaFile] || kandaInfoMap['Bala_Srga.html'];
}

/**
 * Get the Devanagari name for a given Kanda file.
 * @param {string} kandaFile - The Kanda filename
 * @returns {string} Devanagari name
 */
function getKandaName(kandaFile) {
    return kandaNameMap[kandaFile] || 'बालकाण्डः';
}