
# DNS Setup Instructions for vobvorot.com

## Detected Provider: unknown

### Management URL:
Check your domain registrar

### Required Changes:


#### UPDATE SPF Record
- **Type:** TXT
- **Name:** @
- **Action:** Update existing record
- **Current Value:** "v=spf1 include:secureserver.net -all"
- **New Value:** 
  ```
  v=spf1 include:secureserver.net include:_spf.resend.com ~all
  ```


#### ADD DKIM Record
- **Type:** TXT
- **Name:** resend._domainkey
- **Action:** Add new record

- **New Value:** 
  ```
  p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDg4FgBL2fa9sGchvTk2JJw16lvLv8tuSEpBXSaXB+JG33qPfVnCRaLDi8cVDINd+KTfSV8C9DKzXRivdlgpI1KCTW+X4cECgIRiKbyjdVlEZJ5mWLnIQ/YTbuNwVWogvJhxeZkYQGKqeOZpq3Em3tp/SL3RsuprE0u9BnlgWxXEwIDAQAB
  ```


### After Making Changes:
1. Wait 30-60 minutes for DNS propagation
2. Run verification: `node check-dns.js`
3. Test email: `node test-resend.js vobvorot.work@gmail.com`

### Automated Verification:
Run this command after DNS changes:
```bash
node autonomous-resend-alternative.js --verify-only
```
