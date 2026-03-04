import { promises as fs } from 'fs'
import path from 'path'

import { getThoughtArticles } from '@/app/thoughts/articles'

export type CommandPaletteItem = {
  id: string
  title: string
  href: string
  section: 'Page' | 'Project' | 'Thought'
  keywords: string[]
  order: number
}

const PROJECT_PAGE_FILES = new Set([
  'page.tsx',
  'page.ts',
  'page.mdx',
  'page.jsx',
  'page.js',
])

const BASE_ITEMS: CommandPaletteItem[] = [
  {
    id: 'page-about',
    title: 'About',
    href: '/',
    section: 'Page',
    keywords: ['home', 'about', 'qaiik'],
    order: 10,
  },
  {
    id: 'page-thoughts',
    title: 'Thoughts',
    href: '/thoughts',
    section: 'Page',
    keywords: ['articles', 'blog', 'posts'],
    order: 20,
  },
  {
    id: 'page-projects',
    title: 'Projects',
    href: '/projects',
    section: 'Page',
    keywords: ['work', 'portfolio'],
    order: 30,
  },
  {
    id: 'page-siftli',
    title: 'SIFTLI',
    href: '/siftli',
    section: 'Page',
    keywords: ['upload', 'telegram', 'discord'],
    order: 40,
  },
  {
    id: 'page-performance',
    title: 'Performance',
    href: '/performance',
    section: 'Page',
    keywords: ['lighthouse', 'uptime', 'latency', 'response'],
    order: 45,
  },
  {
    id: 'page-visuals',
    title: 'Visuals',
    href: '/visuals',
    section: 'Page',
    keywords: ['design', 'images', 'media'],
    order: 50,
  },
  {
    id: 'page-guestbook',
    title: 'Guestbook',
    href: '/guestbook',
    section: 'Page',
    keywords: ['contact', 'message'],
    order: 60,
  },
]

function segmentToLabel(segment: string): string {
  return segment
    .split('-')
    .filter(Boolean)
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(' ')
}

async function getProjectItems(): Promise<CommandPaletteItem[]> {
  const projectsRoot = path.join(process.cwd(), 'app', 'projects')
  const entries = await fs.readdir(projectsRoot, { withFileTypes: true })

  const projectItems: CommandPaletteItem[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith('_')) continue

    const folderPath = path.join(projectsRoot, entry.name)
    const folderEntries = await fs.readdir(folderPath)
    const hasPage = folderEntries.some((name) => PROJECT_PAGE_FILES.has(name))
    if (!hasPage) continue

    const href = `/projects/${entry.name}`
    const title = entry.name.toLowerCase() === 'siftli'
      ? 'SIFTLI Project'
      : `${segmentToLabel(entry.name)} Project`

    projectItems.push({
      id: `project-${entry.name}`,
      title,
      href,
      section: 'Project',
      keywords: ['project', entry.name],
      order: 200,
    })
  }

  projectItems.sort((a, b) => a.title.localeCompare(b.title))
  return projectItems
}

export async function getCommandPaletteItems(): Promise<CommandPaletteItem[]> {
  const [thoughts, projects] = await Promise.all([
    getThoughtArticles(),
    getProjectItems(),
  ])

  const thoughtItems: CommandPaletteItem[] = thoughts.map((article, index) => ({
    id: `thought-${article.slug}`,
    title: article.title,
    href: `/thoughts/${article.slug}`,
    section: 'Thought',
    keywords: [article.slug, article.description, 'thought']
      .join(' ')
      .split(/\s+/)
      .filter(Boolean),
    order: 300 + index,
  }))

  const dedupedByHref = new Map<string, CommandPaletteItem>()
  for (const item of [...BASE_ITEMS, ...projects, ...thoughtItems]) {
    if (!dedupedByHref.has(item.href)) {
      dedupedByHref.set(item.href, item)
    }
  }

  return Array.from(dedupedByHref.values()).sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return a.title.localeCompare(b.title)
  })
}
