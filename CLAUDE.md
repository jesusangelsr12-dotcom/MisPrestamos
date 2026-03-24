# Cuotas — Finance Tracker App

## Project Overview
App móvil-first (PWA, iOS) para rastrear gastos en MSI (meses sin intereses)
por tarjeta de crédito, préstamos hechos a otros y préstamos recibidos.
El objetivo es saber exactamente cuánto se paga por mes en compromisos financieros.

## Tech Stack
- Next.js 14 (App Router, TypeScript estricto)
- Supabase (PostgreSQL)
- Tailwind CSS + shadcn/ui
- Framer Motion
- next-pwa (instalable en iOS)
- Zod (validación)
- bcryptjs (PIN hash)

## Design System
- Mobile-first, minimalista, limpio
- Background: #F7F7F5
- Accent: #2C6CFF
- Text: #1A1A1A
- Font display: DM Sans
- Font numbers: DM Mono (siempre alineados a la derecha)
- Sin bordes innecesarios, sin sombras pesadas
- Touch targets mínimo 44x44px (iOS HIG)

## Mobile Rules
- Safe area: usar pb-safe, pt-safe (tailwind-safe-area plugin)
- Sin hover-only interactions
- Bottom nav siempre visible
- Font size nunca menor a 14px
- Diseño pensado para una mano

## Architecture Rules
- NUNCA lógica de negocio en componentes UI — usar hooks o server actions
- SIEMPRE TypeScript strict, sin `any`
- Todas las queries a Supabase van en `/lib/supabase/`
- Componentes en `/components/`, páginas en `/app/`
- Validación con Zod en formularios y API routes
- Optimistic updates en todas las acciones de usuario

## Folder Structure
/app
  /(auth)/pin/
  /(auth)/setup-pin/
  /(app)/dashboard/
  /(app)/cards/
  /(app)/msi/
  /(app)/loans/
/components
  /ui          ← shadcn components
  /features    ← domain components
/lib
  /supabase    ← client.ts, server.ts, queries
  /hooks       ← custom hooks
  /utils       ← finance.ts, helpers
/types
  index.ts
/supabase
  /migrations

## Data Models

### cards
- id: uuid PK
- name: text (ej. "Visa Azul")
- bank: text (ej. "BBVA")
- color: text (hex, para identificación visual)
- last_four: text (4 dígitos)
- created_at: timestamptz

### msi_expenses
- id: uuid PK
- card_id: uuid FK → cards.id
- description: text
- total_amount: numeric
- monthly_amount: numeric (calculado: total / months)
- months: integer
- months_paid: integer (default 0)
- start_date: date
- owner: text (enum: 'me' | 'other')
- owner_name: text (nullable, solo si owner = 'other')
- created_at: timestamptz

### loans_given (préstamos que hago a otros)
- id: uuid PK
- borrower_name: text
- amount: numeric (total del préstamo)
- monthly_payment: numeric
- total_months: integer
- months_paid: integer (default 0)
- start_date: date
- notes: text (nullable)
- created_at: timestamptz

### loans_received (préstamos que me hacen)
- id: uuid PK
- lender_name: text
- amount: numeric
- monthly_payment: numeric
- total_months: integer
- months_paid: integer (default 0)
- start_date: date
- notes: text (nullable)
- created_at: timestamptz

### pin_auth
- id: uuid PK
- hashed_pin: text
- created_at: timestamptz

## Key Business Logic
- monthly_amount = total_amount / months
- remaining_months = months - months_paid
- remaining_amount = monthly_amount * remaining_months
- isActive = months_paid < months
- Dashboard total este mes = suma de monthly_amount de todos los MSI activos
  + suma de monthly_payment de loans_given activos
  + suma de monthly_payment de loans_received activos

## Git Workflow
- Branch principal: main
- Después de completar cada Phase, commit y push a main
- Formato: feat(phase-N): descripción breve
- NUNCA hacer push con errores de TypeScript
- Correr `npx tsc --noEmit` antes de cada commit

## Quality Gates (antes de aprobar cada fase)
- Zero TypeScript errors: `npx tsc --noEmit`
- Zero ESLint errors: `npx eslint .`
- Mobile viewport correcto en Chrome DevTools (iPhone 14 Pro)

## Current Phase
Phase 0 — CLAUDE.md created ✓
