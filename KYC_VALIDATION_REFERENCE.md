# Image Validation & KYC Workflow Reference

## Image Validation Rules

### Document Upload (Passport, National ID, Military ID)

**File Size Limits:**
- Maximum: 5 MB (5,242,880 bytes)
- Recommended: Keep under 3 MB for faster uploads

**Allowed File Types:**
- MIME Types: `image/jpeg`, `image/png`, `image/jpg`, `application/pdf`
- File Extensions: `.jpg`, `.jpeg`, `.png`, `.pdf`

**Image Processing:**
- Compression: Enabled (80% quality)
- Max Width: 1920 pixels
- Aspect Ratio: Preserved
- Format: JPEG (after compression)

**Validation Checks:**
1. File type validation (MIME type + extension)
2. File size validation (< 5MB)
3. Image quality check (optional future enhancement)
4. Readability check (optional future enhancement)

### Selfie Upload

**File Size Limits:**
- Maximum: 2 MB (2,097,152 bytes)
- Recommended: Keep under 1.5 MB

**Allowed File Types:**
- MIME Types: `image/jpeg`, `image/png`, `image/jpg`
- File Extensions: `.jpg`, `.jpeg`, `.png`
- Note: PDFs not allowed for selfies

**Image Processing:**
- Compression: Enabled (70% quality)
- Max Width: 1280 pixels
- Aspect Ratio: Preserved (3:4 recommended for portrait)
- Format: JPEG (after compression)

**Validation Checks:**
1. File type validation (MIME type + extension)
2. File size validation (< 2MB)
3. Face detection (optional future enhancement)
4. Liveness detection (optional future enhancement)

---

## KYC Workflow State Machine

### Status Flow Diagram

```
null/undefined (Not Started)
    |
    | User submits documents
    ↓
pending (Pending Review)
    |
    | Admin opens for review
    ↓
under_review (Under Review)
    |
    ├─→ verified (Verified ✓) [Terminal State]
    |
    └─→ rejected (Rejected) 
           |
           | User can resubmit
           ↓
        pending (back to review)
```

### Status Definitions

#### 1. `null` / `undefined` (Not Started)
- **Meaning**: User has not submitted KYC documents
- **User Can**:
  - ✅ Start verification process
  - ✅ Upload documents
- **UI Display**: "Not Started" badge (gray)
- **Action Button**: "Start Verification"

#### 2. `pending` (Pending Review)
- **Meaning**: Documents submitted, waiting for admin review
- **User Can**:
  - ❌ Cannot resubmit
  - ✅ View submission details
- **Admin Can**:
  - ✅ Move to "under_review"
  - ✅ Reject with reason
- **UI Display**: "Pending Review" badge (orange)
- **Action Button**: None (show info message)

#### 3. `under_review` (Under Review)
- **Meaning**: Admin actively reviewing documents
- **User Can**:
  - ❌ Cannot resubmit
  - ✅ View status
- **Admin Can**:
  - ✅ Approve → "verified"
  - ✅ Reject → "rejected" with reason
- **UI Display**: "Under Review" badge (blue)
- **Action Button**: None (show info message)

#### 4. `verified` (Verified ✓)
- **Meaning**: KYC approved, user identity verified
- **User Can**:
  - ✅ Access all features
  - ❌ Cannot resubmit (already verified)
- **Admin Can**:
  - ❌ Cannot change status (terminal)
- **UI Display**: "Verified ✓" badge (green)
- **Action Button**: None
- **Database Fields Set**:
  - `verified_at`: timestamp
  - `reviewed_by`: admin user ID
  - `reviewed_at`: timestamp

#### 5. `rejected` (Rejected)
- **Meaning**: KYC rejected, documents not accepted
- **User Can**:
  - ✅ View rejection reason
  - ✅ Resubmit with new documents
- **Admin Can**:
  - ❌ Cannot further review until resubmission
- **UI Display**: "Rejected" badge (red) + rejection reason
- **Action Button**: "Resubmit Verification"
- **Database Fields Set**:
  - `rejection_reason`: text explanation
  - `reviewed_by`: admin user ID
  - `reviewed_at`: timestamp

---

## KYC Workflow Permissions Matrix

| Status         | User: View | User: Submit | User: Resubmit | Admin: Review | Admin: Approve | Admin: Reject |
|----------------|------------|--------------|----------------|---------------|----------------|---------------|
| null           | ✅         | ✅           | N/A            | N/A           | N/A            | N/A           |
| pending        | ✅         | ❌           | ❌             | ✅            | ❌             | ✅            |
| under_review   | ✅         | ❌           | ❌             | ✅            | ✅             | ✅            |
| verified       | ✅         | ❌           | ❌             | ✅            | ❌             | ❌            |
| rejected       | ✅         | ❌           | ✅             | ❌            | ❌             | ❌            |

---

## Document Type Specifications

### Passport
- **Valid For**: International travel document
- **Required Information**:
  - Full name
  - Photo
  - Date of birth
  - Passport number
  - Expiry date
- **Upload Tips**:
  - Photo page only
  - Ensure all text is readable
  - Avoid glare/shadows
  - Check expiry date is valid

### National ID
- **Valid For**: Government-issued identification
- **Required Information**:
  - Full name
  - Photo
  - ID number
  - Date of birth
- **Upload Tips**:
  - Front side (with photo)
  - Ensure barcode/chip visible if present
  - Clear, unobstructed view

### Military ID
- **Valid For**: Military service identification
- **Required Information**:
  - Full name
  - Photo
  - Service number
  - Rank (if applicable)
- **Upload Tips**:
  - Photo side
  - Ensure all credentials visible
  - Valid service dates

---

## Selfie Requirements

### Photo Guidelines
- **Face visibility**: Full face visible, no obstructions
- **Lighting**: Well-lit, avoid harsh shadows
- **Background**: Plain, uncluttered background
- **Expression**: Neutral, eyes open
- **Accessories**: Remove sunglasses, hats (religious headwear allowed)
- **Image Quality**: Sharp, not blurry

### Future Enhancements (Not Implemented Yet)
- **Liveness Detection**: Blink, turn head, smile
- **Face Matching**: Compare selfie to document photo
- **Age Estimation**: Verify age matches document
- **Spoofing Detection**: Detect if photo is a photo of a photo

---

## Storage Structure

### Supabase Storage Buckets

#### kyc-documents
- **Path Format**: `{user_id}/{document_type}_{timestamp}_{random}.jpg`
- **Example**: `a1b2c3d4.../national_id_1738540800000_x7k9m2.jpg`
- **Max File Size**: 5 MB
- **MIME Types**: `image/jpeg`, `image/png`, `application/pdf`
- **RLS Policy**: User can only access their own folder

#### kyc-selfies
- **Path Format**: `{user_id}/selfie_{timestamp}_{random}.jpg`
- **Example**: `a1b2c3d4.../selfie_1738540800000_p4n8q1.jpg`
- **Max File Size**: 2 MB
- **MIME Types**: `image/jpeg`, `image/png`
- **RLS Policy**: User can only access their own folder

---

## Error Handling

### Common Validation Errors

| Error | Cause | User Message | Solution |
|-------|-------|--------------|----------|
| FILE_TOO_LARGE | File > 5MB (doc) or > 2MB (selfie) | "File size exceeds {X}MB limit" | Compress image or choose smaller file |
| INVALID_FILE_TYPE | Wrong MIME type or extension | "Invalid file type. Allowed types: .jpg, .png, .pdf" | Select correct file format |
| UPLOAD_FAILED | Network or storage error | "Failed to upload file. Please try again." | Retry upload, check connection |
| COMPRESSION_FAILED | Image manipulation error | "Error processing image" | Use original file, report issue |
| NO_FACE_DETECTED | Face detection failed (future) | "No face detected in selfie" | Retake selfie with face visible |

### Admin Review Rejection Reasons (Examples)

Common rejection reasons admins might use:
- "Document expired"
- "Photo not clear / blurry"
- "Document not readable"
- "Selfie does not match document photo"
- "Document appears to be tampered"
- "Wrong document type submitted"
- "Name mismatch with account details"
- "Document belongs to another person"

---

## Database Schema Reference

### kyc Table

```sql
CREATE TABLE kyc (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id),
    status kyc_status DEFAULT 'pending',
    document_type document_type NOT NULL,
    document_url TEXT NOT NULL,
    selfie_url TEXT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Enums

```sql
CREATE TYPE kyc_status AS ENUM (
    'pending',
    'under_review',
    'verified',
    'rejected'
);

CREATE TYPE document_type AS ENUM (
    'passport',
    'national_id',
    'military_id'
);
```

---

## API Reference (Supabase Client)

### Upload Document
```typescript
const { data, error } = await supabase.storage
  .from('kyc-documents')
  .upload(filename, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  });
```

### Create KYC Record
```typescript
const { error } = await supabase
  .from('kyc')
  .insert({
    user_id: user.id,
    status: 'pending',
    document_type: 'national_id',
    document_url: 'path/to/document.jpg',
    selfie_url: 'path/to/selfie.jpg',
    submitted_at: new Date().toISOString(),
  });
```

### Fetch KYC Status
```typescript
const { data, error } = await supabase
  .from('kyc')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

### Update KYC Status (Admin Only)
```typescript
const { error } = await supabase
  .from('kyc')
  .update({
    status: 'verified',
    verified_at: new Date().toISOString(),
    reviewed_by: admin_user_id,
    reviewed_at: new Date().toISOString(),
  })
  .eq('id', kyc_record_id);
```

---

## Testing Checklist

### Image Validation Testing

- [ ] Upload document < 5MB → Should succeed
- [ ] Upload document > 5MB → Should fail with size error
- [ ] Upload JPEG document → Should succeed
- [ ] Upload PNG document → Should succeed
- [ ] Upload PDF document → Should succeed
- [ ] Upload TXT file as document → Should fail with type error
- [ ] Upload selfie < 2MB → Should succeed
- [ ] Upload selfie > 2MB → Should fail with size error
- [ ] Upload PDF as selfie → Should fail with type error

### Workflow Testing

- [ ] Submit KYC → Status = 'pending'
- [ ] Try to resubmit while 'pending' → Should not allow
- [ ] Admin moves to 'under_review' → Status updates
- [ ] Admin approves → Status = 'verified', verified_at set
- [ ] Try to submit after 'verified' → Should not allow
- [ ] Admin rejects → Status = 'rejected', reason shown
- [ ] Resubmit after 'rejected' → Should allow, new 'pending' record

---

**Last Updated**: February 4, 2026
**Version**: 1.0.0
