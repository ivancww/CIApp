(function (global) {
  "use strict";
  const providers = new Map();
  const DB_NAME = "AVA_USER_STORAGE_V1";
  const STORE_NAME = "files";

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function operation(mode, callback) {
    const database = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, mode);
        const request = callback(tx.objectStore(STORE_NAME));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.onerror = () => reject(tx.error);
      });
    } finally { database.close(); }
  }

  function registerProvider(provider) {
    if (!provider?.id) throw new Error("Storage Provider需要有效ID。");
    ["saveFile", "resolveFile", "deletePersonalFile", "getMetadata"].forEach(method => {
      if (typeof provider[method] !== "function") throw new Error(`Storage Provider ${provider.id} 缺少 ${method}()。`);
    });
    providers.set(provider.id, Object.freeze(provider));
  }

  registerProvider({
    id: "local", name: "此裝置", icon: "📱",
    description: "只儲存在這部裝置",
    privacyNote: "清除瀏覽器／PWA資料或轉換裝置後需要重新上載。",
    isAvailable: () => "indexedDB" in global,
    async saveFile(file, context) {
      if (!file?.name) throw new Error("請選擇有效檔案。");
      const now = new Date().toISOString();
      const id = context?.reference || `ava-file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      await operation("readwrite", store => store.put({ id, blob:file, filename:file.name, mimeType:file.type || "application/octet-stream", size:Number(file.size)||0, createdAt:now, updatedAt:now }));
      return { providerId:"local", reference:id, filename:file.name, mimeType:file.type, size:file.size, createdAt:now };
    },
    async resolveFile(reference) { return (await operation("readonly", store => store.get(reference)))?.blob || null; },
    async deletePersonalFile(reference) { await operation("readwrite", store => store.delete(reference)); return true; },
    async getMetadata(reference) {
      const record = await operation("readonly", store => store.get(reference));
      if (!record) return null;
      const { blob, ...metadata } = record;
      return metadata;
    }
  });

  global.AVAStorage = Object.freeze({
    registerProvider,
    async getAvailableProviders(context) {
      const result = [];
      for (const provider of providers.values()) if (!provider.isAvailable || await provider.isAvailable(context || {})) result.push(provider);
      return result;
    },
    saveFile: (id, file, context) => providers.get(id).saveFile(file, context || {}),
    resolveFile: (id, reference) => providers.get(id).resolveFile(reference),
    deletePersonalFile: (id, reference) => providers.get(id).deletePersonalFile(reference),
    getMetadata: (id, reference) => providers.get(id).getMetadata(reference)
  });
})(window);
