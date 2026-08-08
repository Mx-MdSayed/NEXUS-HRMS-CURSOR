import { employeeService } from '@/features/employees/services/employeeService'
import { initialEssDocuments } from '../data/mockEssDocuments'
import type { EmployeeDocument } from '../types'

let documentsDb: EmployeeDocument[] = structuredClone(initialEssDocuments)

function delay(ms = 100): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export const essDocumentService = {
  async getDocuments(employeeId: string): Promise<EmployeeDocument[]> {
    await delay()
    const uploaded = await employeeService.getEmployeeDocuments(employeeId)
    const uploadedDocs: EmployeeDocument[] = uploaded.map((item) => ({
      id: `employee-${item.id}`,
      employeeId,
      title: item.name,
      description: `Uploaded ${item.category.replaceAll('_', ' ')} document.`,
      category:
        item.category === 'joining_letter'
          ? 'employment'
          : item.category === 'id_proof' || item.category === 'address_proof'
            ? 'identity'
            : 'other',
      fileName: item.name,
      fileType: item.fileType,
      issuedAt: item.uploadedAt.slice(0, 10),
      href: item.url,
    }))

    return structuredClone(
      [...documentsDb.filter((item) => item.employeeId === employeeId), ...uploadedDocs].sort((a, b) =>
        b.issuedAt.localeCompare(a.issuedAt),
      ),
    )
  },
}
