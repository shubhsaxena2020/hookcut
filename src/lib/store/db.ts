"use client";
import type { Project, ProjectMeta } from "@/lib/types";

const DB = "hookcut";
const VERSION = 1;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("projects")) db.createObjectStore("projects", { keyPath: "id" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        const r = fn(s);
        let result: T | undefined;
        if (r) r.onsuccess = () => (result = r.result);
        t.oncomplete = () => {
          db.close();
          resolve(result);
        };
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }),
  );
}

export function metaOf(p: Project): ProjectMeta {
  return {
    id: p.id,
    name: p.name,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    duration: p.duration,
    width: p.width,
    height: p.height,
    clipCount: p.clips.length,
  };
}

export async function saveProject(p: Project) {
  // structured clone keeps the Blob and typed arrays intact
  await tx("projects", "readwrite", (s) => s.put(p));
  await tx("meta", "readwrite", (s) => s.put(metaOf(p)));
}

export async function listProjects(): Promise<ProjectMeta[]> {
  try {
    const all = (await tx<ProjectMeta[]>("meta", "readonly", (s) => s.getAll() as IDBRequest<ProjectMeta[]>)) ?? [];
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export async function loadProject(id: string): Promise<Project | undefined> {
  return tx<Project>("projects", "readonly", (s) => s.get(id) as IDBRequest<Project>);
}

export async function deleteProject(id: string) {
  await tx("projects", "readwrite", (s) => s.delete(id));
  await tx("meta", "readwrite", (s) => s.delete(id));
}
