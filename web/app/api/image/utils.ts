// @ts-expect-error there's no types for this lib and we don't care
import { makeRe } from 'next/dist/compiled/picomatch'
import type { RemotePattern } from 'next/dist/shared/lib/image-config'

export function matchRemotePattern(pattern: RemotePattern, url: URL): boolean {
  if (pattern.protocol !== undefined) {
    const actualProto = url.protocol.slice(0, -1)
    if (pattern.protocol !== actualProto) {
      return false
    }
  }
  if (pattern.port !== undefined) {
    if (pattern.port !== url.port) {
      return false
    }
  }

  if (pattern.hostname === undefined) {
    throw new Error(`Pattern should define hostname but found\n${JSON.stringify(pattern)}`)
  } else {
    if (!makeRe(pattern.hostname).test(url.hostname)) {
      return false
    }
  }

  if (!makeRe(pattern.pathname ?? '**', { dot: true }).test(url.pathname)) {
    return false
  }

  return true
}

export function hasMatch(remotePatterns: RemotePattern[], url: URL): boolean {
  return remotePatterns.some((p) => matchRemotePattern(p, url))
}
