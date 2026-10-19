import { createRxDatabase, type RxCollection, type RxDatabase, type RxJsonSchema } from "rxdb/plugins/core";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

interface SystemicWorksDocument {
  id: "active";
  projectData: string;
  updatedAt: number;
}
interface CanonicalModelDocument { id: "active"; model: string; updatedAt: number; }

interface SystemicWorksModel {
  serialize(): string;
  deserialize(data: string, filename: string): void;
}

interface SystemicWorksApp {
  model: SystemicWorksModel;
}

type ProjectCollection = RxCollection<SystemicWorksDocument>;
type CanonicalCollection = RxCollection<CanonicalModelDocument>;
type ProjectDatabase = RxDatabase<{ projects: ProjectCollection; canonicalModels: CanonicalCollection }>;

const legacyKey = "mos.systemicworks.project.v1";
const canonicalKey = "mos.systemicworks.canonical-model.v1";
const schema: RxJsonSchema<SystemicWorksDocument> = {
  title: "/m:os SystemicWorks local project",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 16 },
    projectData: { type: "string", maxLength: 1_000_000 },
    updatedAt: { type: "number", minimum: 0 },
  },
  required: ["id", "projectData", "updatedAt"],
  additionalProperties: false,
};
const canonicalSchema: RxJsonSchema<CanonicalModelDocument> = {
  title: "/m:os canonical model workspace",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: { id: { type: "string", maxLength: 16 }, model: { type: "string", maxLength: 1_000_000 }, updatedAt: { type: "number", minimum: 0 } },
  required: ["id", "model", "updatedAt"],
  additionalProperties: false,
};

let enqueueCanonicalModel: ((raw: string) => void) | null = null;
let pendingCanonicalModel: string | null = null;
export function saveCanonicalModel(raw: string): void {
  pendingCanonicalModel = raw;
  enqueueCanonicalModel?.(raw);
}

async function openDatabase(): Promise<ProjectDatabase> {
  const db = await createRxDatabase<{ projects: ProjectCollection; canonicalModels: CanonicalCollection }>({
    name: "mos_systemicworks_workspace",
    storage: getRxStorageDexie(),
    multiInstance: true,
  });
  await db.addCollections({ projects: { schema }, canonicalModels: { schema: canonicalSchema } });
  return db;
}

export function attachSystemicWorksLocalWorkspace(app: SystemicWorksApp): void {
  const bar = document.getElementById("bar");
  if (!bar) return;

  const status = document.createElement("span");
  status.id = "local-save-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.textContent = "Opening local workspace…";
  bar.append(status);

  let db: ProjectDatabase | null = null;
  let timer: number | null = null;
  let opening = true;
  const show = (message: string) => { status.textContent = message; };

  const persist = () => {
    if (opening) return;
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = null;
      const projectData = app.model.serialize();
      if (db) {
        void db.projects.incrementalUpsert({ id: "active", projectData, updatedAt: Date.now() })
          .then(() => show("Saved on this device"))
          .catch(() => fallbackSave(projectData));
      } else {
        fallbackSave(projectData);
      }
    }, 300);
  };

  const fallbackSave = (projectData: string) => {
    try {
      localStorage.setItem(legacyKey, projectData);
      show("Saved in browser storage");
    } catch {
      show("Local saving unavailable · export a project file");
    }
  };

  const queryHasProject = new URLSearchParams(location.search).has("data");
  void (async () => {
    try {
      db = await openDatabase();
      const savedDoc = await db.projects.findOne("active").exec();
      const saved = savedDoc?.toJSON().projectData;
      if (queryHasProject) {
        show("Shared project opened · saving locally");
      } else if (saved) {
        app.model.deserialize(saved, "local-project.smwks");
        show("Restored from this device");
      } else {
        const legacy = localStorage.getItem(legacyKey);
        if (legacy) app.model.deserialize(legacy, "local-project.smwks");
        show(legacy ? "Browser draft restored · moving to local database" : "Local workspace ready");
      }
      opening = false;
      enqueueCanonicalModel = raw => {
        void db!.canonicalModels.incrementalUpsert({ id: "active", model: raw, updatedAt: Date.now() })
          .then(() => show("System and map saved on this device"))
          .catch(() => { try { localStorage.setItem(canonicalKey, raw); } catch { /* Browser storage may be unavailable. */ } });
      };
      const canonical = pendingCanonicalModel ?? (await db.canonicalModels.findOne("active").exec())?.toJSON().model;
      if (canonical) {
        window.dispatchEvent(new CustomEvent("mos-model-restored", { detail: canonical }));
        if (pendingCanonicalModel) enqueueCanonicalModel(pendingCanonicalModel);
      }
      if (queryHasProject || !saved) persist();
      try { localStorage.removeItem(legacyKey); } catch { /* Browser storage may be unavailable. */ }
    } catch {
      opening = false;
      let legacy: string | null = null;
      try { legacy = localStorage.getItem(legacyKey); } catch { /* Browser storage may be unavailable. */ }
      if (!queryHasProject && legacy) app.model.deserialize(legacy, "local-project.smwks");
      show("Browser storage mode · stays on this device");
      enqueueCanonicalModel = raw => { try { localStorage.setItem(canonicalKey, raw); } catch { /* Browser storage may be unavailable. */ } };
      const canonical = pendingCanonicalModel;
      if (canonical) window.dispatchEvent(new CustomEvent("mos-model-restored", { detail: canonical }));
      persist();
    }
  })();

  const subscribe = (window as Window & { subscribe?: (topic: string, handler: () => void) => void }).subscribe;
  subscribe?.("model/changed", persist);
  window.addEventListener("pagehide", () => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
      persistNow();
    }
  });

  function persistNow() {
    const projectData = app.model.serialize();
    if (db) void db.projects.incrementalUpsert({ id: "active", projectData, updatedAt: Date.now() }).catch(() => fallbackSave(projectData));
    else fallbackSave(projectData);
  }
}
