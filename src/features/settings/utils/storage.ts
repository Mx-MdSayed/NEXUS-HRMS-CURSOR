/**
 * Local storage abstraction for company assets (logos).
 * No external storage service — data URLs / in-memory for demo.
 */
export interface StorageObject {
  key: string
  contentType: string
  dataUrl: string
  uploadedAt: string
}

const memory = new Map<string, StorageObject>()

export const localAssetStorage = {
  async put(key: string, file: File): Promise<StorageObject> {
    const dataUrl = await readAsDataUrl(file)
    const obj: StorageObject = {
      key,
      contentType: file.type || 'application/octet-stream',
      dataUrl,
      uploadedAt: new Date().toISOString(),
    }
    memory.set(key, obj)
    return obj
  },

  async get(key: string): Promise<StorageObject | null> {
    return memory.get(key) ?? null
  },

  async remove(key: string): Promise<void> {
    memory.delete(key)
  },
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
