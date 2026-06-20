'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  NUMERIC_FIELDS,
  MATERIAL_FIELDS,
  MATERIAL_PRESETS,
  UNLOCK_TOGGLES,
  MIN_FILE_SIZE,
  readSave,
  writeSave,
} from '../lib/saveFormat';

function fmtBytes(n) {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

export default function Page() {
  const [fileName, setFileName] = useState(null);
  const [fileSize, setFileSize] = useState(0);
  const [original, setOriginal] = useState(null);
  const [state, setState] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const loadBuffer = useCallback((buf, name) => {
    const bytes = new Uint8Array(buf);
    if (bytes.length < MIN_FILE_SIZE) {
      setError(
        `That file is only ${bytes.length} bytes — too small to be a Drakengard 3 save (expect ~48 KB). Make sure you picked PAYLOAD, not PARAM.SFO.`
      );
      return;
    }
    setError(null);
    setOriginal(bytes);
    setState(readSave(bytes));
    setFileName(name);
    setFileSize(bytes.length);
    setDirty(false);
  }, []);

  const onFile = useCallback(
    (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => loadBuffer(reader.result, file.name);
      reader.onerror = () => setError('Could not read that file.');
      reader.readAsArrayBuffer(file);
    },
    [loadBuffer]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      onFile(e.dataTransfer.files?.[0]);
    },
    [onFile]
  );

  const setNumeric = (key, raw) => {
    const v = raw === '' ? 0 : Number(raw);
    setState((s) => ({ ...s, numeric: { ...s.numeric, [key]: v } }));
    setDirty(true);
  };
  const setMaterial = (key, raw) => {
    const v = raw === '' ? 0 : Number(raw);
    setState((s) => ({ ...s, materials: { ...s.materials, [key]: v } }));
    setDirty(true);
  };
  const setAllMaterials = (v) => {
    setState((s) => {
      const materials = { ...s.materials };
      for (const f of MATERIAL_FIELDS) materials[f.key] = v;
      return { ...s, materials };
    });
    setDirty(true);
  };
  const toggleUnlock = (key) => {
    setState((s) => ({ ...s, unlocks: { ...s.unlocks, [key]: !s.unlocks[key] } }));
    setDirty(true);
  };

  const download = useCallback(() => {
    if (!original || !state) return;
    const out = writeSave(original, state);
    const blob = new Blob([out], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PAYLOAD';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setDirty(false);
  }, [original, state]);

  const reset = useCallback(() => {
    if (original) {
      setState(readSave(original));
      setDirty(false);
    }
  }, [original]);

  const loaded = !!state;
  const originalState = useMemo(() => (original ? readSave(original) : null), [original]);
  const changed = (group, key, val) =>
    originalState && originalState[group][key] !== Math.round(Number(val) || 0);

  return (
    <main className="wrap">
      <section className="device">
        <div className="faceplate-top">
          <span className="eyebrow">Drag-On Dragoon</span>
          <span className="statuslight">
            <span className={`led ${loaded ? 'green' : 'red'}`} />
          </span>
        </div>
        <h1 className="title">
          Drakengard <span className="three">3</span>
          <span className="small">Save Editor</span>
        </h1>
        <p className="subtitle">
          Open a decrypted <code>PAYLOAD</code> from your <code>NPUB31251-SAVE</code> folder, change what you
          need, and write it back. Everything stays in this tab — your save never leaves your machine. Keep a
          copy of the original before overwriting.
        </p>

        {!loaded && (
          <div
            className={`panel bay${dragging ? ' drag' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div className="drophint">{dragging ? 'Release to load' : 'Drag PAYLOAD here'}</div>
            <h2>Load your save</h2>
            <p>Drop the file above, or choose it from disk.</p>
            <button className="btn primary" onClick={() => inputRef.current?.click()}>
              Choose PAYLOAD
            </button>
            <input ref={inputRef} type="file" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            {error && <p className="err">{error}</p>}
          </div>
        )}
      </section>

      {loaded && (
        <>
          <div className="panel strip">
            <span className="chip"><span className="led green" /><span className="name">{fileName}</span></span>
            <span className="dot">·</span>
            <span>{fmtBytes(fileSize)}</span>
            <span className="spacer" />
            <button className="btn sm" onClick={() => inputRef.current?.click()}>Load another</button>
            <input ref={inputRef} type="file" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          </div>

          <section className="panel module" style={{ animationDelay: '40ms' }}>
            <div className="module-head">
              <span className="num">i</span>
              <h3>Gold &amp; Experience</h3>
            </div>
            {NUMERIC_FIELDS.map((f) => {
              const val = state.numeric[f.key];
              const isChanged = changed('numeric', f.key, val);
              return (
                <div className="field" key={f.key}>
                  <div>
                    <div className={`nm${f.key === 'gold' ? ' gold' : ''}`}>
                      {f.label}
                      {isChanged && <span className="mark" />}
                    </div>
                    <div className="desc">{f.help}</div>
                  </div>
                  <input
                    className={`well${isChanged ? ' changed' : ''}`}
                    type="number"
                    min={f.min}
                    max={f.max}
                    value={val}
                    onChange={(e) => setNumeric(f.key, e.target.value)}
                  />
                </div>
              );
            })}
          </section>

          <section className="panel module" style={{ animationDelay: '90ms' }}>
            <div className="module-head">
              <span className="num">ii</span>
              <h3>Materials</h3>
            </div>
            <div className="presets">
              <span className="lbl">Set all to</span>
              {MATERIAL_PRESETS.map((p) => (
                <button key={p} className="btn sm" onClick={() => setAllMaterials(p)}>{p}</button>
              ))}
            </div>
            {MATERIAL_FIELDS.map((f) => {
              const val = state.materials[f.key];
              const isChanged = changed('materials', f.key, val);
              return (
                <div className="field" key={f.key}>
                  <div>
                    <div className="nm">
                      {f.label}
                      {isChanged && <span className="mark" />}
                    </div>
                  </div>
                  <input
                    className={`well${isChanged ? ' changed' : ''}`}
                    type="number"
                    min={0}
                    value={val}
                    onChange={(e) => setMaterial(f.key, e.target.value)}
                  />
                </div>
              );
            })}
          </section>

          <section className="panel module" style={{ animationDelay: '140ms' }}>
            <div className="module-head">
              <span className="num">iii</span>
              <h3>Unlocks</h3>
            </div>
            {UNLOCK_TOGGLES.map((t) => {
              const on = !!state.unlocks[t.key];
              return (
                <div className="rocker" key={t.key}>
                  <div className="nm">{t.label}</div>
                  <div
                    className={`switch${on ? ' on' : ''}`}
                    role="switch"
                    aria-checked={on}
                    aria-label={t.label}
                    tabIndex={0}
                    onClick={() => toggleUnlock(t.key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleUnlock(t.key);
                      }
                    }}
                  />
                </div>
              );
            })}
            <p className="hint">
              Switching an unlock off won&apos;t restore the old data — reload the file to back out a change.
            </p>
          </section>

          <div className="panel savebar">
            <span className="status">
              <span className={`led ${dirty ? 'red' : 'green'}`} />
              {dirty ? 'Unsaved changes' : <span className="ok">Up to date</span>}
            </span>
            <span className="spacer" />
            <button className="btn ghost" onClick={reset} disabled={!dirty}>Revert</button>
            <button className="btn primary" onClick={download}>Write PAYLOAD</button>
          </div>

          <div className="note">
            <strong>Putting it back:</strong> the downloaded file is named <code>PAYLOAD</code>. Replace the one
            in your RPCS3 save folder (<code>dev_hdd0/home/00000001/savedata/NPUB31251-SAVE/</code>), keeping a
            backup of the original. RPCS3 re-seals the folder on its own — no re-signing needed.
          </div>
        </>
      )}

      <p className="credit">Background art: Miyukiko — &ldquo;This silence&rdquo;</p>
    </main>
  );
}
