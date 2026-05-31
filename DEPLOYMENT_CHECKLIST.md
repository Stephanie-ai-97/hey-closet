# AI Clothing Scanning - Deployment Checklist

**Last Updated:** May 31, 2026

## Pre-Deployment (Local Development)

### Code Review
- [x] All TypeScript files compile without AI-related errors
- [x] aiValidation.ts - 9.7 KB ✅
- [x] AiReviewModal.tsx - 16 KB ✅
- [x] aiClothingScan.ts - Enhanced with retry logic ✅
- [x] Documentation - 3 comprehensive guides (50 KB) ✅
- [x] No breaking changes to existing functionality
- [x] Backward compatible with existing ItemModal

### Dependencies
- [x] zod@3.24.1 added to package.json
- [x] npm install completed successfully
- [x] No unresolved import errors

### Testing (Manual)
- [ ] Test image upload in ItemModal
- [ ] Test AI scan progress UI
- [ ] Test review modal functionality
- [ ] Test field editing in modal
- [ ] Verify all dropdowns have correct options
- [ ] Test retry functionality
- [ ] Test rate limiting (6 scans per 60 seconds)
- [ ] Test fallback to manual entry
- [ ] Verify responsive design on mobile

---

## Pre-Deployment (Server Configuration)

### Supabase Setup
- [ ] Navigate to https://supabase.com → Select your project
- [ ] Go to: Settings → Functions → Environment Variables
- [ ] Add environment variable:
  - Key: `OPENAIN_API_KEY`
  - Value: `sk-proj-...` (from OpenAI dashboard)
  - Click "Save"
- [ ] Wait for function to auto-redeploy (should show "active")

### OpenAI Account
- [ ] Create/access OpenAI account: https://platform.openai.com
- [ ] Navigate to: API Keys → Create new secret key
- [ ] Copy key value (starts with `sk-proj-`)
- [ ] Keep key secure (don't commit to git)
- [ ] Check account has API credits/billing enabled

### Database
- [ ] Verify itemphoto table exists:
  ```sql
  SELECT * FROM information_schema.tables 
  WHERE table_name = 'itemphoto';
  ```
- [ ] Verify columns: storage_path, processed_storage_path, ai_confidence_score, ai_tags, ai_metadata, ai_status
- [ ] Verify indexes exist

### Storage
- [ ] Verify Supabase Storage bucket "item-photos" exists
- [ ] Check bucket policies allow upload for authenticated users
- [ ] Verify public access is set correctly (if needed)

### Function Logs
- [ ] Go to Supabase Console → Functions → storage → Logs
- [ ] Verify no errors in logs
- [ ] Should see recent endpoint deployments

---

## Deployment Checklist

### Code Deployment
- [ ] Commit all changes to git
- [ ] Push to main branch (or staging)
- [ ] Verify CI/CD pipeline passes
- [ ] Review code changes one more time
- [ ] Merge to production branch (if using separate branches)

### Vercel Deployment
- [ ] Trigger deployment (automatic on push or manual via Vercel dashboard)
- [ ] Wait for build to complete
- [ ] Check build logs for errors
- [ ] Verify homepage loads
- [ ] Test navigation to ItemModal

### Post-Deployment Verification

#### 1. Basic Connectivity (5 minutes)
- [ ] Can add new item
- [ ] ItemModal appears without errors
- [ ] AI upload section visible
- [ ] Upload button clickable

#### 2. Image Upload (5 minutes)
- [ ] Upload a test image
- [ ] Progress indicator shows ("Optimizing image...")
- [ ] Image preview appears
- [ ] No console errors

#### 3. AI Analysis (5-10 minutes)
- [ ] Progress changes to "Analyzing clothing..."
- [ ] AI response appears (should take 2-5 seconds)
- [ ] AiReviewModal opens with results
- [ ] Confidence score displays (85%+ typical)
- [ ] Metadata fields show valid values

#### 4. Review Modal (5 minutes)
- [ ] All fields editable
- [ ] Can change category, color, material, etc.
- [ ] Image preview visible
- [ ] "Apply" button functional
- [ ] Edits apply to form fields
- [ ] Form submits successfully

#### 5. Error Handling (5 minutes)
- [ ] Retry on simulated failure works
- [ ] Rate limit enforced after 6 scans
- [ ] Error messages are clear
- [ ] Manual entry still available
- [ ] No unhandled exceptions in console

#### 6. Database (5 minutes)
- [ ] Check itemphoto table has new records
- [ ] Verify ai_confidence_score populated
- [ ] Verify ai_tags populated
- [ ] Verify ai_metadata populated
- [ ] Verify ai_status is "completed"

#### 7. Storage (5 minutes)
- [ ] Check Supabase Storage bucket for images
- [ ] Verify original image uploaded
- [ ] Verify processed image uploaded
- [ ] Images are accessible via URL

#### 8. Mobile Testing (5 minutes)
- [ ] Test on mobile device/browser
- [ ] UI responsive and readable
- [ ] Upload still works
- [ ] Modal displays correctly
- [ ] Buttons clickable

---

## Monitoring (First 24 Hours)

### Logs to Watch
- [ ] Supabase Edge Function logs (no errors)
- [ ] Vercel deployment logs (no errors)
- [ ] Browser console (no JavaScript errors)
- [ ] OpenAI API usage dashboard

### Metrics to Track
- [ ] Scan completion rate
- [ ] Average confidence score
- [ ] Error rate by type
- [ ] Response time (target: < 5 seconds)
- [ ] API cost per scan

### Alerts to Set Up
- [ ] Supabase function error rate > 5%
- [ ] Response time > 10 seconds (avg)
- [ ] OpenAI API errors > 10%
- [ ] Database query time > 500ms

---

## Rollback Plan

If critical issues discovered:

### Immediate (< 30 minutes)
1. Disable AI upload button:
   ```tsx
   disabled={true}  // In ItemModal
   ```

2. Hide AI section in ItemModal:
   ```tsx
   {false && <AiSection />}  // Comment out
   ```

3. Force redeploy previous version

### Short-term (< 2 hours)
1. Fix issue in development
2. Test thoroughly locally
3. Redeploy to staging first
4. Monitor staging for 30 minutes
5. Deploy to production

### Communication
- [ ] Notify users of issue (if applicable)
- [ ] Post status update
- [ ] Document incident
- [ ] Plan post-mortem

---

## Post-Deployment (Week 1)

### Performance Baseline
- [ ] Measure scan completion time
- [ ] Measure image size reduction
- [ ] Track API latency
- [ ] Document confidence score distribution

### User Feedback
- [ ] Collect user feedback on AI suggestions
- [ ] Track "accepted vs edited" rate
- [ ] Gather confidence feedback
- [ ] Look for common error patterns

### Cost Analysis
- [ ] Track OpenAI API spend
- [ ] Calculate cost per scan
- [ ] Monitor storage usage growth
- [ ] Optimize if needed

### Documentation
- [ ] Update README with AI feature
- [ ] Add screenshots/GIFs
- [ ] Create user guide (if needed)
- [ ] Document any configuration changes

---

## Post-Deployment (Week 2-4)

### Analytics Review
- [ ] Weekly usage metrics
- [ ] Error rate trends
- [ ] Performance trends
- [ ] Cost projections

### Optimization
- [ ] Adjust rate limits if needed
- [ ] Fine-tune image compression
- [ ] Cache frequently used models
- [ ] Monitor for memory leaks

### Enhancements
- [ ] Collect feature requests
- [ ] Plan Phase 2 improvements
- [ ] Schedule team discussion
- [ ] Document lessons learned

---

## Known Limitations

- [ ] **Rate limit:** 6 scans per 60 seconds per client
- [ ] **File size:** Max 50MB per image
- [ ] **Image types:** JPEG, PNG, WebP only
- [ ] **Model:** gpt-4o-mini (can be changed)
- [ ] **Accuracy:** Not 100% - user review required
- [ ] **Privacy:** Images sent to OpenAI for analysis

---

## Documentation References

- **AI_SCANNING_GUIDE.md** - Complete implementation reference
- **AI_QUICK_START.md** - Setup and usage guide
- **AI_IMPLEMENTATION_SUMMARY.md** - Overview and features
- **Inline code comments** - Implementation details

---

## Support Contacts

For deployment issues:
1. Check Supabase status page
2. Check OpenAI status page
3. Review function logs in Supabase Console
4. Check browser console for errors
5. Verify all environment variables set

---

## Sign-Off

- [ ] QA approved for production
- [ ] Product owner approved
- [ ] Tech lead reviewed
- [ ] Security reviewed
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Ready for production deployment

**Deployed by:** ________________  
**Date:** ________________________  
**Approved by:** __________________

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | May 31, 2026 | Initial release with OpenAI Vision API integration |

