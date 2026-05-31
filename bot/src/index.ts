import 'dotenv/config'

async function main() {
  console.log('[Triax Bot] Starting triangulation engine...')
  console.log(`[Triax Bot] RPC: ${process.env.RPC_URL ?? 'not set'}`)
  console.log(`[Triax Bot] DB:  ${process.env.DATABASE_URL ?? 'not set'}`)
}

main().catch((err) => {
  console.error('[Triax Bot] Fatal error:', err)
  process.exit(1)
})
