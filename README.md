# Drakengard 3 Save Editor (Next.js)

A browser-based re-implementation of the old `Dragon_3.exe` community save editor for
**Drakengard 3 / Drag-On Dragoon 3** (PS3, ID `NPUB31251`). It edits the same fields the
original did, but runs entirely client-side in the browser — your save never gets uploaded
anywhere.

It works directly on the **decrypted `PAYLOAD`** file, which is what RPCS3 stores on disk, so
there's no decryption/re-signing step. (On real PS3 hardware you'd still need to re-sign the
save folder with a tool such as pfdtool.)

The UI is themed after Miyukiko's Drakengard 3 illustration "This silence" — ivory text, a
rose-crimson accent, muted gold reserved for the Gold field, on frosted dark-glass panels that
float over a full-bleed background. It's hand-written CSS in `app/globals.css` (no Tailwind),
using Cormorant Garamond + Inter. Changed fields are flagged with a small gold dot — no raw
hex on screen.

### Background image

The page looks for `public/background.jpg`. Drop your own artwork there (personal use) and it
fills the page behind the panels; without it, a painterly gradient fallback keeps things looking
finished. To point somewhere else, edit `--bg-image` in `app/globals.css`. The referenced
artwork is not bundled — please use your own copy and credit the artist.

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

Build for production with `npm run build && npm start`.

## Use it

1. Click **Choose PAYLOAD** and open the `PAYLOAD` file from your save folder
   (`dev_hdd0/home/00000001/savedata/NPUB31251-SAVE/PAYLOAD`).
2. Edit Gold, Experience, Materials, or flip any of the Unlock toggles.
   The mono readout on each row shows the exact big-endian bytes that will be written.
3. Click **Write PAYLOAD** to download the modified file (named `PAYLOAD`).
4. **Back up your original first**, then drop the new `PAYLOAD` into the save folder. RPCS3
   re-seals the folder automatically.

## What it edits — the format

All values are 32-bit **big-endian** integers at absolute offsets in the decrypted PAYLOAD.
This map was recovered from the original editor's compiled logic; it does not modify any
checksum/header field (the original didn't either).

| Field                | Offset            | Notes                                  |
|----------------------|-------------------|----------------------------------------|
| Gold                 | `0x4C` (76)       | 0 – 999,999,999                        |
| Experience           | `0x54` (84)       | 0 – 999,999,999; level recomputes      |
| Material slot 1–4    | `0x2AC`–`0x2B8`   | plain item counts                      |
| All chapters         | `0x2C4` (708)     | writes a fixed flag table when enabled |
| All bonus chapters   | `0x4D0` (1232)    | "                                      |
| All swords           | `0x8C8` (2248)    | "                                      |
| All spears           | `0xBC8` (3016)    | "                                      |
| All fighting equip.  | `0xEC8` (3784)    | "                                      |
| All senwa            | `0x11C8` (4552)   | "                                      |

The unlock toggles write the same byte arrays the original tool used. Turning a toggle back
**off** does not restore the previous bytes — reload the file to undo.

## Project layout

```
app/
  layout.js        root layout + metadata
  page.jsx         the editor UI (client component)
  globals.css      visual system
lib/
  saveFormat.js    offsets, unlock blobs, read/write helpers (all the format knowledge)
```

If you find more fields later, add them to `lib/saveFormat.js` — the UI builds itself from
those arrays.

## Notes & caveats

- Always keep a backup of your original `PAYLOAD`.
- Made for the RPCS3 / decrypted workflow. For sealed on-console saves you must re-sign.
- This is a fan tool for single-player saves; it ships none of the original editor's files.
