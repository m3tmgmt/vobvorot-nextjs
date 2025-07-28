# VobVorot Site Backup Information

## Working State Backup - 2025-06-13 20:20:20

### Git Details
- **Commit**: `023865d` - Fix WesternBid integration according to official documentation
- **Tag**: `backup-working-site-20250613-202020`
- **Date**: June 13, 2025 11:08:06 +0300

### Vercel Deployment
- **Working Deployment ID**: `dpl_BCHMETuyFL8BCYpGnMtKgmKGmRKN`
- **Domain**: https://vobvorot.com
- **Status**: READY
- **Project**: vobvorot-nextjs (prj_wklXebOcLWo9edf0BCL1nwpYGDhZ)

### Restoration Commands
To restore this exact state:

```bash
# Git restore
git checkout backup-working-site-20250613-202020

# Or by commit hash
git reset --hard 023865d

# Vercel domain assignment (if needed)
curl -X POST "https://api.vercel.com/v2/deployments/dpl_BCHMETuyFL8BCYpGnMtKgmKGmRKN/aliases" \
  -H "Authorization: Bearer yGHkW9HSoepeo4Q8ZnSBEKwn" \
  -H "Content-Type: application/json" \
  -d '{"alias": "vobvorot.com"}'
```

### Site State
- **Status**: Working main VobVorot store site
- **WesternBid Integration**: Fixed according to official documentation
- **No Issues**: Site loads properly, not showing test payment page
- **Features**: Complete store functionality with corrected payment integration

### Notes
This backup was created after successfully restoring the main VobVorot site and removing the test payment page that was incorrectly deployed to the production domain.