import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import Document from '#models/document'
import fs from 'node:fs/promises'

export default class DocumentsController {
  async index() {
    return await Document.query().orderBy('createdAt', 'desc')
  }

  async upload({ request, response }: HttpContext) {
    const file = request.file('document', {
      extnames: ['pdf', 'doc', 'docx', 'txt'],
      size: '10mb',
    })

    if (!file) {
      return response.badRequest({ message: 'No file uploaded' })
    }

    if (!file.isValid) {
      return response.badRequest({ errors: file.errors })
    }

    const currentUser = request.user!

    await file.move(app.makePath('uploads'), {
      name: `${new Date().getTime()}_${file.clientName}`,
    })

    const document = await Document.create({
      title: request.input('title') || file.clientName,
      filePath: file.fileName!,
      uploadedBy: currentUser.id,
    })

    return response.created(document)
  }

  async destroy({ params, response }: HttpContext) {
    const document = await Document.find(params.id)

    if (!document) {
      return response.notFound({ message: 'Document not found' })
    }

    // Try to delete file from disk
    try {
      await fs.unlink(app.makePath('uploads', document.filePath))
    } catch (err) {
      console.log('File not found on disk, continuing with DB deletion')
    }

    await document.delete()

    return response.ok({ message: 'Document deleted successfully' })
  }
}
