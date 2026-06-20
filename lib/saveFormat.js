// lib/saveFormat.js
//
// Drakengard 3 (Drag-On Dragoon 3) PS3 save format.
//
// This map was recovered from the original community editor (Dragon_3.exe, "Drag On
// Dragoon3 Save-Editor [PS3] v1.0.0.0"). That tool decrypts the PSN save with pfdtool,
// edits these absolute byte offsets inside the decrypted PAYLOAD, then re-signs it.
//
// On RPCS3 the PAYLOAD on disk is ALREADY decrypted, so we edit it directly and the
// emulator re-seals the save folder for us. No encryption / checksum step is required:
// the original tool never recomputes any checksum field, it only writes these values.
//
// All scalar values are 32-bit BIG-ENDIAN integers (the PS3 is big-endian).
// Offsets are absolute from the start of the PAYLOAD file.

// ---- Scalar fields (32-bit, big-endian) ----
export const NUMERIC_FIELDS = [
  {
    key: 'gold',
    label: 'Gold',
    offset: 0x4c, // 76
    min: 0,
    max: 999999999,
    help: 'Currency. The original "Gold" box.',
  },
  {
    key: 'experience',
    label: 'Experience',
    offset: 0x54, // 84
    min: 0,
    max: 999999999,
    help: 'Total EXP. Drives your level — set it high and the game recomputes the level on load.',
  },
];

// ---- Material / item quantities (the original "Material x ()" combo boxes) ----
// Four consecutive Int32 slots. Original UI capped picks at 99; the data is a plain
// count, so larger values work, but 99 matches the in-game stack ceiling.
export const MATERIAL_FIELDS = [
  { key: 'material1', label: 'Material slot 1', offset: 0x2ac }, // 684
  { key: 'material2', label: 'Material slot 2', offset: 0x2b0 }, // 688
  { key: 'material3', label: 'Material slot 3', offset: 0x2b4 }, // 692
  { key: 'material4', label: 'Material slot 4', offset: 0x2b8 }, // 696
];
export const MATERIAL_PRESETS = [50, 99, 999];

// ---- Unlock toggles ----
// When enabled, the original writes a fixed array of flags at the given offset.
// We reproduce those byte arrays verbatim. Disabling a toggle does NOT restore the
// original bytes (the source tool had no "undo" either) — reload the file to back out.
export const UNLOCK_TOGGLES = [
  {
    key: 'all_chapters',
    label: 'All chapters unlocked',
    offset: 0x2c4, // 708
    hex:
      '0000002F0000000300000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000000',
  },
  {
    key: 'all_bonus_chapters',
    label: 'All bonus chapters unlocked',
    offset: 0x4d0, // 1232
    hex:
      '000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001',
  },
  {
    key: 'all_swords',
    label: 'All swords unlocked',
    offset: 0x8c8, // 2248
    hex:
      '0000000000000000000000020000000100000000000000020000000200000000000000020000000300000000000000020000000400000000000000020000000500000000000000020000000600000000000000020000000700000000000000020000000800000000000000020000000900000000000000020000000A00000000000000020000000B00000000000000020000000C00000000000000020000000D00000000000000020000000E00000000000000020000000F0000000000000002000000100000000000000002000000110000000000000002',
  },
  {
    key: 'all_spears',
    label: 'All spears unlocked',
    offset: 0xbc8, // 3016
    hex:
      '0000000000000000000000020000000100000000000000020000000200000000000000020000000300000000000000020000000400000000000000020000000500000000000000020000000600000000000000020000000700000000000000020000000800000000000000020000000900000000000000020000000A00000000000000020000000B0000000000000002',
  },
  {
    key: 'all_fighting_equipment',
    label: 'All fighting equipment unlocked',
    offset: 0xec8, // 3784
    hex:
      '0000000000000000000000020000000100000000000000020000000200000000000000020000000300000000000000020000000400000000000000020000000500000000000000020000000600000000000000020000000700000000000000020000000800000000000000020000000900000000000000020000000A0000000000000002',
  },
  {
    key: 'all_senwa',
    label: 'All senwa (talismans) unlocked',
    offset: 0x11c8, // 4552
    hex:
      '000000000000000000000002000000010000000000000002000000020000000000000002000000030000000000000002000000040000000000000002000000050000000000000002000000060000000000000002000000070000000000000002000000080000000000000002000000090000000000000002',
  },
];

export const MIN_FILE_SIZE = 0x11c8 + 4; // must at least cover the furthest offset we touch

// ---- byte helpers ----
export function hexToBytes(hex) {
  const clean = hex.replace(/\s+/g, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

export function bytesToHex(bytes, offset = 0, length = bytes.length) {
  let s = '';
  for (let i = 0; i < length; i++) {
    s += bytes[offset + i].toString(16).padStart(2, '0').toUpperCase();
  }
  return s;
}

export function readU32BE(bytes, offset) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return dv.getUint32(offset, false);
}

export function writeU32BE(bytes, offset, value) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  dv.setUint32(offset, value >>> 0, false);
}

// Read all known fields from a PAYLOAD into a plain object.
export function readSave(bytes) {
  const state = { numeric: {}, materials: {}, unlocks: {} };
  for (const f of NUMERIC_FIELDS) state.numeric[f.key] = readU32BE(bytes, f.offset);
  for (const f of MATERIAL_FIELDS) state.materials[f.key] = readU32BE(bytes, f.offset);
  // A toggle reads as "already applied" if the bytes at its offset already match the blob.
  for (const t of UNLOCK_TOGGLES) {
    const blob = hexToBytes(t.hex);
    let matches = true;
    for (let i = 0; i < blob.length; i++) {
      if (bytes[t.offset + i] !== blob[i]) {
        matches = false;
        break;
      }
    }
    state.unlocks[t.key] = matches;
  }
  return state;
}

// Apply edited state back onto a COPY of the original bytes and return the new buffer.
export function writeSave(originalBytes, state) {
  const out = new Uint8Array(originalBytes); // copy, never mutate the source
  for (const f of NUMERIC_FIELDS) {
    const v = state.numeric[f.key];
    if (Number.isFinite(v)) writeU32BE(out, f.offset, clamp(v, f.min ?? 0, f.max ?? 0xffffffff));
  }
  for (const f of MATERIAL_FIELDS) {
    const v = state.materials[f.key];
    if (Number.isFinite(v)) writeU32BE(out, f.offset, clamp(v, 0, 0xffffffff));
  }
  for (const t of UNLOCK_TOGGLES) {
    if (state.unlocks[t.key]) {
      const blob = hexToBytes(t.hex);
      out.set(blob, t.offset);
    }
  }
  return out;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}
