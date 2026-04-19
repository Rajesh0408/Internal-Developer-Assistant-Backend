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

    // Ping Python FAISS microservice to ingest document
    try {
      const absoluteFilePath = app.makePath('uploads', file.fileName!)
      // The frontend URL would typically resolve uploads via backend URL + /uploads/...
      const docUrl = `/uploads/${file.fileName!}`
      
      await fetch('http://127.0.0.1:8000/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: absoluteFilePath,
          filename: file.clientName,
          doc_url: docUrl
        })
      })
    } catch (err) {
      console.error('Failed to notify FAISS service of new document:', err)
      // Optional: Don't fail the upload just because FAISS is down
    }

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
