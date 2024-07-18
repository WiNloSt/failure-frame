import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: 'Failure Frame chapter %s',
    default: 'Failure Frame',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
