import { delay, http, type HttpHandler, HttpResponse } from 'msw'
import { playerSchema } from '../../saves/PlayerSchema'

interface Save {
  id: number
  name: string
  uploadedAt: string
  save: string
}

function isAscii (buffer: ArrayBuffer) {
  const uint8Array = new Uint8Array(buffer)
  for (let i = 0; i < uint8Array.length; i++) {
    if (uint8Array[i] > 127) {
      return false
    }
  }

  return true
}

const saves: Save[] = []

export const cloudSaveHandlers: HttpHandler[] = [
  http.get('/saves/retrieve/metadata', async () => {
    await delay(2500)

    return HttpResponse.json(saves.map((s) => {
      const { save, ...rest } = s
      return rest
    }))
  }),
  http.get('/saves/retrieve/all', async () => {
    await delay(5000)
    return HttpResponse.json(saves)
  }),
  http.post('/saves/upload', async ({ request }) => {
    await delay(5000)

    const fd = await request.formData()
    const file = fd.get('file')
    const name = fd.get('name')

    if (!(file instanceof File) || typeof name !== 'string') {
      return new HttpResponse(null, { status: 400 })
    }

    const text = await file.arrayBuffer()

    if (!isAscii(text)) {
      return new Response(null, { status: 400 })
    }

    const base64 = await file.text()
    const decoded = atob(base64)
    const player = playerSchema.parse(JSON.parse(decoded))
    const save = JSON.stringify(player)
    saves.push({ id: saves.length, name, uploadedAt: new Date().toString(), save })

    return new Response('Ok!', { status: 200 })
  })
]
