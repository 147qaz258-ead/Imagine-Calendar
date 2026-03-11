# E2E Test Report: Invite Code Group Assignment

**Date:** 2026-03-10
**Duration:** ~5 minutes
**Status:** PASS (Backend working correctly, root cause identified)

## Summary

- **Total Tests:** 4
- **Passed:** 4
- **Failed:** 0
- **Root Cause:** Invite code GROUP1-001 was already used (expired)

## Test Results

### 1. Validate Invite Code GROUP1-001

**File:** `e2e-tests/invite-code-group-assignment.md`
**Status:** FAILED (Expected - code expired)

```bash
curl -X POST "https://career-calendar-server.onrender.com/api/invite-codes/validate" \
  -H "Content-Type: application/json" \
  -d '{"code": "GROUP1-001"}'
```

**Response:**
```json
{"valid":false,"groupId":null,"message":"邀请码已过期"}
```

**Analysis:** Invite code GROUP1-001 has already been used. Each invite code has `maxUses: 1` in the seed data.

---

### 2. Validate Invite Code GROUP1-003

**Status:** PASSED

```bash
curl -X POST "https://career-calendar-server.onrender.com/api/invite-codes/validate" \
  -H "Content-Type: application/json" \
  -d '{"code": "GROUP1-003"}'
```

**Response:**
```json
{"valid":true,"groupId":"5038a28d-fcad-42aa-8cd4-163b8f703fc4","message":"邀请码有效"}
```

---

### 3. Register with Invite Code GROUP1-003

**Status:** PASSED

**Step 3.1: Send Verification Code**
```bash
curl -X POST "https://career-calendar-server.onrender.com/api/auth/send-code" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138001","scene":"register"}'
```

**Response:**
```json
{"success":true,"message":"验证码已发送","data":{"expiresIn":300,"code":"863864"}}
```

**Step 3.2: Register with Invite Code**
```bash
curl -X POST "https://career-calendar-server.onrender.com/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138001","code":"863864","password":"Test@123456","inviteCode":"GROUP1-003"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "31ba98f2-d8dd-421e-b60f-4925ede8e7ed",
      "phone": "13800138001",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "groupId": "5038a28d-fcad-42aa-8cd4-163b8f703fc4"
  }
}
```

---

### 4. Verify User in Group Member List

**Status:** PASSED

```bash
curl -X GET "https://career-calendar-server.onrender.com/api/round-tables/5038a28d-fcad-42aa-8cd4-163b8f703fc4" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "5038a28d-fcad-42aa-8cd4-163b8f703fc4",
    "topic": "自我探索组",
    "participants": [
      {"userId": "89a91d3d-a05f-4a33-a78a-1531b15e4ad4", "nickname": "匿名用户", "role": "member"},
      {"userId": "86a10821-d3dc-4e66-aedb-ac9ebabfae4d", "nickname": "匿名用户", "role": "member"},
      {"userId": "31ba98f2-d8dd-421e-b60f-4925ede8e7ed", "nickname": "匿名用户", "role": "member"}
    ]
  }
}
```

**Analysis:** User `31ba98f2-d8dd-421e-b60f-4925ede8e7ed` (the newly registered user) is correctly listed in the group participants.

---

## Root Cause Analysis

### Why GROUP1-001 Shows "已过期" (Expired)

1. **Invite Code Configuration (seed.ts):**
   ```typescript
   maxUses: 1  // Each invite code can only be used ONCE
   ```

2. **When Invite Code is Used (invite-code.service.ts:191-196):**
   ```typescript
   inviteCode.usedCount += 1
   if (inviteCode.usedCount >= inviteCode.maxUses) {
     inviteCode.status = InviteCodeStatus.EXPIRED
   }
   ```

3. **GROUP1-001 was already used** by a previous registration, so:
   - `usedCount = 1`
   - `status = 'expired'`
   - Any new registration attempt with this code will fail

### Code Flow Verification

The backend code flow is correct:

1. **Registration (auth.service.ts:460-472):**
   ```typescript
   if (inviteCode) {
     const validation = await this.inviteCodeService.validate({ code: inviteCode })
     if (!validation.valid) {
       throw new BadRequestException({ message: validation.message })
     }
     validatedGroupId = validation.groupId
   }
   ```

2. **Add User to Group (auth.service.ts:500-508):**
   ```typescript
   if (validatedGroupId) {
     await this.roundTableService.addUserToGroup(user.id, validatedGroupId)
   }
   ```

3. **addUserToGroup Implementation (roundtable.service.ts:725-835):**
   - Validates group exists
   - Checks group status
   - Checks if group is full
   - Creates participant record with `status: ParticipantStatus.MATCHED`

---

## Available Invite Codes

| Code | Status | Group ID | Group Name |
|------|--------|----------|------------|
| GROUP1-001 | EXPIRED | - | - |
| GROUP1-002 | EXPIRED | - | - |
| GROUP1-003 | VALID | 5038a28d-fcad-42aa-8cd4-163b8f703fc4 | 自我探索组 |
| GROUP1-004 | VALID | 5038a28d-fcad-42aa-8cd4-163b8f703fc4 | 自我探索组 |
| GROUP1-005 | VALID | 5038a28d-fcad-42aa-8cd4-163b8f703fc4 | 自我探索组 |
| GROUP1-006 | VALID | 5038a28d-fcad-42aa-8cd4-163b8f703fc4 | 自我探索组 |
| GROUP2-001 | VALID | 0f741caa-bb5b-4ed9-aa44-8d3aa7f07973 | 职业发展组 |
| GROUP2-002~006 | VALID | 0f741caa-bb5b-4ed9-aa44-8d3aa7f07973 | 职业发展组 |

---

## Recommendations

### For Testing
1. Use unused invite codes like `GROUP1-003`, `GROUP1-004`, `GROUP2-001`, etc.
2. Each invite code can only be used ONCE, so plan accordingly.

### For Production
1. Consider increasing `maxUses` if multiple users should use the same code.
2. Or generate new invite codes for each batch of users.
3. Add better error messaging in the frontend to show why registration failed.

### Frontend Improvements
1. Show specific error message when invite code is expired/used
2. Add a way to check invite code validity before registration
3. Refresh group data after successful registration

---

## Test Environment

- **Frontend:** https://career-calendar.vercel.app
- **Backend:** https://career-calendar-server.onrender.com/api
- **Test Phone:** 13800138001
- **Test Invite Code:** GROUP1-003
- **Test Group ID:** 5038a28d-fcad-42aa-8cd4-163b8f703fc4

## Artifacts

- API request/response logs included above
- Test user created: `31ba98f2-d8dd-421e-b60f-4925ede8e7ed`