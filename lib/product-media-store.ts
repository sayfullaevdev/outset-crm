import type { Product } from "@/lib/types";

const DB_NAME = "outset-crm";
const STORE_NAME = "product-media";
const DB_VERSION = 1;
let databasePromise: Promise<IDBDatabase> | null = null;

export type ProductMedia = Pick<Product, "photoUrl" | "galleryUrls">;

type StoredProductMedia = ProductMedia & {
  productId: string;
  updatedAt: string;
};

function normalizeMedia(media: ProductMedia): ProductMedia {
  const photoUrl = media.photoUrl || "";
  const galleryUrls = Array.from(
    new Set([photoUrl, ...media.galleryUrls].filter((value) => typeof value === "string" && value.length > 0)),
  );

  return {
    photoUrl: photoUrl || galleryUrls[0] || "",
    galleryUrls,
  };
}

function isBrowser() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function wrapRequest<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openDatabase() {
  if (!isBrowser()) {
    return Promise.resolve(null as never);
  }

  if (!databasePromise) {
    databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: "productId" });
        }
      };

      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => {
          database.close();
          databasePromise = null;
        };
        resolve(database);
      };
      request.onerror = () => {
        databasePromise = null;
        reject(request.error);
      };
    });
  }

  return databasePromise;
}

export async function saveProductMedia(productId: string, media: ProductMedia) {
  if (!productId || !isBrowser()) {
    return;
  }

  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  const normalizedMedia = normalizeMedia(media);

  await wrapRequest(
    store.put({
      productId,
      ...normalizedMedia,
      updatedAt: new Date().toISOString(),
    } satisfies StoredProductMedia),
  );

  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function loadProductMedia(productId: string): Promise<ProductMedia | null> {
  if (!productId || !isBrowser()) {
    return null;
  }

  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const record = (await wrapRequest(store.get(productId))) as StoredProductMedia | undefined;

  if (!record) {
    return null;
  }

  return normalizeMedia(record);
}

async function loadStoredMediaMap(productIds: string[]) {
  if (!productIds.length || !isBrowser()) {
    return new Map<string, ProductMedia>();
  }

  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const records = (await wrapRequest(store.getAll())) as StoredProductMedia[];
  const ids = new Set(productIds);

  return records.reduce((acc, record) => {
    if (ids.has(record.productId)) {
      acc.set(record.productId, normalizeMedia(record));
    }

    return acc;
  }, new Map<string, ProductMedia>());
}

export async function hydrateProductsWithStoredMedia(products: Product[]) {
  const mediaMap = await loadStoredMediaMap(products.map((product) => product.id));

  return products.map((product) => {
    const storedMedia = mediaMap.get(product.id);

    if (!storedMedia) {
      return product;
    }

    return {
      ...product,
      photoUrl: storedMedia.photoUrl || product.photoUrl,
      galleryUrls: storedMedia.galleryUrls.length ? storedMedia.galleryUrls : product.galleryUrls,
    };
  });
}
