import type { NextRequest } from 'next/server'
import sharp, { type Sharp } from 'sharp'
import crypto from 'crypto'
import nextConfig from '@/next.config.mjs'
import { hasMatch } from './utils'
import { MAX_IMAGE_WIDTH } from '@/app/chapters/[chapterNumber]/utils'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ifNoneMatch = request.headers.get('If-None-Match')
  const url = searchParams.get('url')
  const quality = Number(searchParams.get('q'))
  const width = Number(searchParams.get('w'))

  if (!url) {
    return new Response('`url` must be specified.', { status: 400, statusText: 'Bad Request' })
  }

  if (!verifyAllowedUrl(url)) {
    return new Response(`"${url}" is not allowed.`, { status: 403, statusText: 'Forbidden' })
  }

  if (quality <= 0) {
    return new Response('`q` must be a positive integer from 1 to 100.', {
      status: 400,
      statusText: 'Bad Request',
    })
  }

  if (width <= 0) {
    return new Response('`w` must be a positive integer.', {
      status: 400,
      statusText: 'Bad Request',
    })
  }

  const imageBuffer = await fetch(url)
    .then((response) => response.blob())
    .then((blob) => blob.arrayBuffer())

  const image = sharp(imageBuffer)
  console.log({ imageBuffer, url })

  let metadata
  try {
    metadata = await image.metadata()
  } catch (e) {
    console.error('Can not get metadata')
  }

  if (!metadata) {
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Cache-Control': `public, s-maxage=${30 * DAY}, stale-while-revalidate=${30 * DAY};`,
        'CDN-Cache-Control': `public, s-maxage=${30 * DAY}, stale-while-revalidate=${30 * DAY};`,
      },
    })
  }

  const defaultWidth = metadata?.width || MAX_IMAGE_WIDTH
  const { data, info } = await processImage(image, {
    width: width <= defaultWidth ? width : defaultWidth,
    quality,
  })

  const eTag = getHash(data)
  console.log({ original: metadata, resized: info, ifNoneMatch, eTag })
  // ensure we send the new cache control
  // if (ifNoneMatch === eTag) {
  //   return new Response(null, { status: 304, statusText: 'Not Modified' })
  // }

  return new Response(data, {
    status: 200,
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': `public, s-maxage=${30 * DAY}, stale-while-revalidate=${30 * DAY};`,
      'CDN-Cache-Control': `public, s-maxage=${30 * DAY}, stale-while-revalidate=${30 * DAY};`,
      'Content-Length': info.size.toString(),
      ETag: eTag,
    },
  })
}

function verifyAllowedUrl(url: string) {
  const remotePatterns = nextConfig.images?.remotePatterns
  if (!remotePatterns) {
    return false
  }

  return hasMatch(remotePatterns, new URL(url))
}

const DAY = 24 * 60 * 60

async function processImage(image: Sharp, { quality, width }: { quality: number; width: number }) {
  return image
    .resize({ width })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true })
    .catch(() => image.resize({ width }).jpeg({ quality }).toBuffer({ resolveWithObject: true }))
}

function getHash(buffer: Buffer) {
  const hash = crypto.createHash('sha1')
  hash.update(buffer)
  return hash.digest('hex')
}
