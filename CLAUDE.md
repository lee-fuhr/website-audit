# Website Audit Tool - Claude context

## ⚠️ DEPLOYMENT - READ THIS FIRST

**Production URL:** `https://website-audit-tool-xi.vercel.app/`
**Custom domain:** `websiteaudit.leefuhr.com` - NOT WORKING YET (DNS/SSL pending)

**Deploy command:** `vercel --prod` from project root

**After deploy:** Tell user to check `https://website-audit-tool-xi.vercel.app/` NOT the custom domain

**Version not visible in UI** - Check CHANGELOG.md or deployment timestamp

## Project structure

- `/src/app/preview/[id]/page.tsx` - Main results/preview page (most UI work happens here)
- `/src/app/api/analyze/route.ts` - Backend analysis API
- `/src/components/ViewNavBar.tsx` - Navigation component (wrapper pattern)
- `/src/lib/version.ts` - Single source of truth for version number
- `CHANGELOG.md` - Version history

## Version workflow

1. Make changes
2. Update version in `/src/lib/version.ts`
3. Add changelog entry in `CHANGELOG.md`
4. Run `npm run build` to verify
5. Deploy with `vercel --prod`
