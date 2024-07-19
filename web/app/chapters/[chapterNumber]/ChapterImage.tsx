'use client'
import Image from 'next/image'
import { type Dispatch, type SetStateAction } from 'react'
import { MAX_IMAGE_WIDTH, QUALITY, createImageUrl } from './utils'
import { useIntersectionObserver } from './useIntersectionObserver'
import classNames from 'classnames'
import Style from './style.module.css'

interface ClientImageProps {
  url: string
  width: number | undefined
  height: number | undefined
  pageNumber: number
  onEnterViewport: (isIntersecting: boolean) => void
  priority: boolean
  setRequestImageWidth: Dispatch<SetStateAction<number>>
}

export function ChapterImage({
  url,
  width = MAX_IMAGE_WIDTH,
  height = 2000,
  pageNumber,
  onEnterViewport,
  priority,
  setRequestImageWidth,
}: ClientImageProps) {
  const ref = useIntersectionObserver(onEnterViewport)
  return (
    <Image
      ref={ref}
      loader={createImageUrl}
      onLoad={(e) => {
        const width = new URLSearchParams((e.target as HTMLImageElement).currentSrc).get('w')
        if (width) {
          setRequestImageWidth(Number(width))
        }
      }}
      key={url}
      src={url}
      alt={`Page ${pageNumber}`}
      width={width}
      height={height}
      quality={QUALITY}
      sizes="(max-width: 1279px) 540px, 100vw"
      // @ts-expect-error CSS custom property
      style={{ '--max-image-width': `${MAX_IMAGE_WIDTH}px` }}
      className={classNames('max-w-lg w-full', Style.responsiveImage)}
      priority={priority}
    />
  )
}
