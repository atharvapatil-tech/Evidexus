# EVIDEXUS — DEPLOY TODAY ROADMAP
# Estimated total time: 45-60 minutes

## WHAT'S IN THIS BUILD
- clinical-chat: UPGRADED with real PubMed evidence retrieval pipeline
  - Fetches real articles from PubMed before answering
  - Grades evidence Oxford Level I-V by code (not AI guesswork)  
  - Gemini synthesizes ONLY from retrieved evidence
  - Returns verified sources with real PMID links
- All other functions: Lovable gateway REMOVED, using free Gemini API
- vite.config.ts: lovable-tagger REMOVED
- vercel.json: SPA routing added

---

## STEP 1 — Get Free Gemini API Key (5 min)
1. Go to: https://aistudio.google.com
2. Click "Get API Key" → "Create API Key in new project"
3. Copy the key (starts with AIza...)
4. Cost: FREE — generous free tier, no credit card needed

---

## STEP 2 — Add Secret to Supabase (3 min)
1. Go to: https://supabase.com → open your project
2. Left sidebar → "Edge Functions"
3. Click "Manage secrets" (or Settings → Edge Functions → Secrets)
4. Click "Add new secret"
   Name:  GEMINI_API_KEY
   Value: paste your key from Step 1
5. Click Save

---

## STEP 3 — Run SQL Migration (3 min)
Only needed if you haven't run it before.
1. Supabase → SQL Editor → New Query
2. Paste and run this:

ALTER TABLE query_history 
DROP CONSTRAINT IF EXISTS query_history_tool_type_check;

ALTER TABLE query_history 
ADD CONSTRAINT query_history_tool_type_check 
CHECK (tool_type IN (
  'clinical_chat','literature_search','treatment_comparison',
  'content_analysis','drug_interaction','prescription_verify'
));

---

## STEP 4 — Upload to GitHub (10 min)
1. Go to your GitHub repo: github.com/atharvapatil-tech/evidexushealth
2. Press the DOT KEY (.) → opens browser VS Code
3. Click "Continue in GitHub Codespaces" in terminal
4. Wait ~60 seconds for it to load
5. In the VS Code file explorer, delete old files if needed
6. Drag ALL files from this ZIP into the left panel
   (Right-click → Upload... on the root folder)
7. In the terminal at bottom:
   git add .
   git commit -m "Evidexus v2 - real evidence pipeline, no Lovable"
   git push

---

## STEP 5 — Deploy Edge Functions (10 min)
In the Codespaces terminal, run these commands ONE BY ONE:

supabase login
(it will give you a URL — open it, authorize, come back)

supabase link --project-ref dvclhczfhpanzmnkrsry

supabase functions deploy clinical-chat --no-verify-jwt
supabase functions deploy drug-interactions --no-verify-jwt
supabase functions deploy literature-search --no-verify-jwt
supabase functions deploy compare-treatments --no-verify-jwt
supabase functions deploy prescription-verifier --no-verify-jwt
supabase functions deploy analyze-content --no-verify-jwt

NOTE: The --no-verify-jwt flag is safe here because your
security.ts already handles auth manually.

---

## STEP 6 — Vercel Environment Variables (2 min)
1. Go to: https://vercel.com → your project → Settings → Environment Variables
2. Add these two variables:

Name:  VITE_SUPABASE_URL
Value: https://dvclhczfhpanzmnkrsry.supabase.co

Name:  VITE_SUPABASE_PUBLISHABLE_KEY  
Value: sb_publishable_2RdEiOuWpYIMEW5wBn77Yw_Oa3RG3ez

3. Make sure both are set for Production, Preview, and Development

---

## STEP 7 — Redeploy on Vercel (3 min)
1. Vercel → your project → Deployments tab
2. Click the three dots (...) next to latest deployment
3. Click "Redeploy"
4. Wait ~2 minutes
5. Visit your URL — product is live!

---

## VERIFY IT WORKS
Ask this question in Clinical Q&A:
"First line treatment for dengue with warning signs in India"

You should see:
✓ High confidence or Moderate confidence badge
✓ Real PubMed sources at the bottom with PMID links
✓ Evidence level shown (Level I/II/III)
✓ India context section with ICMR/WHO references
✓ Citations in clinical reasoning like [1][3]

---

## IF SOMETHING BREAKS

Problem: Edge function returns 500
Fix: Check Supabase → Edge Functions → Logs
     Most likely GEMINI_API_KEY is not set — redo Step 2

Problem: Vercel build fails
Fix: Check build logs. Usually a TypeScript error.
     Share the error with your CTO (me) and I'll fix it immediately.

Problem: Auth errors (401)
Fix: Make sure both Supabase env vars are set in Vercel (Step 6)

---

## MONTHLY COST
Gemini API: FREE (1500 requests/day free)
Supabase: FREE (500MB database, 2GB bandwidth)
Vercel: FREE (hobby tier)
Total: ₹0/month

When you exceed free limits (after 500+ daily active users):
- Gemini: ~$0.075 per 1M tokens = very cheap
- Upgrade Supabase to Pro: $25/month
- Vercel Pro: $20/month
You'll be well past revenue by then.
