// Tool card component for dashboard
'use client'

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import { Tool } from '@/lib/types'
import { motion } from 'framer-motion'

interface ToolCardProps {
  tool: Tool
  index: number
}

export function ToolCard({ tool, index }: ToolCardProps) {
  const Icon = (LucideIcons as any)[tool.icon] ?? LucideIcons.Package
  const isDevelopment = tool.status === 'development'
  const isDisabled = tool.status === 'disabled'

  const statusBadge = isDevelopment ? (
    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
      Em Desenvolvimento
    </Badge>
  ) : isDisabled ? (
    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
      Desabilitado
    </Badge>
  ) : null

  const CardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card
        className={cn(
          'group h-full transition-all duration-300 hover:shadow-lg',
          !isDisabled && 'cursor-pointer hover:-translate-y-1',
          isDisabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div
              className={cn(
                'rounded-lg p-3 transition-colors',
                isDevelopment
                  ? 'bg-yellow-100 text-yellow-700 group-hover:bg-yellow-200'
                  : isDisabled
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            {statusBadge}
          </div>

          <div className="space-y-2">
            <CardTitle className="text-lg">{tool.name}</CardTitle>
            <CardDescription className="text-sm">
              {tool.description}
            </CardDescription>
          </div>

          {!isDisabled && (
            <div className="flex items-center gap-2 pt-2 text-sm font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
              {isDevelopment ? 'Em breve' : 'Acessar'}
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </CardHeader>
      </Card>
    </motion.div>
  )

  if (isDisabled || isDevelopment) {
    return CardContent
  }

  return <Link href={tool.href}>{CardContent}</Link>
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
