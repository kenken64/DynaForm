# 🔄 Let's Encrypt Force Renewal Guide

## Quick Commands for Force Renewal

### 🚀 **Most Common: Quick Force Renewal**
```bash
./force-renew-ssl.sh force
# or just
./force-renew-ssl.sh
```

### 🧹 **If Certificate is Corrupted: Recreate**
```bash
./force-renew-ssl.sh recreate
```

### 🧪 **Test with Staging (No Rate Limits)**
```bash
./force-renew-ssl.sh staging
```

### 🔍 **Debug Mode (Verbose Output)**
```bash
./force-renew-ssl.sh verbose
```

### 💥 **Nuclear Option: Clean Slate**
```bash
./force-renew-ssl.sh clean
```

## Manual Commands (if scripts fail)

### 1. **Force Renew Existing Certificate**
```bash
docker compose -f docker-compose.ssl.yml --env-file .env.ssl run --rm certbot \
  renew --force-renewal --cert-name yourdomain.com
```

### 2. **Delete and Recreate Certificate**
```bash
# Delete existing
docker compose -f docker-compose.ssl.yml --env-file .env.ssl run --rm certbot \
  delete --cert-name yourdomain.com --non-interactive

# Create new
docker compose -f docker-compose.ssl.yml --env-file .env.ssl run --rm certbot \
  certonly --webroot --webroot-path=/var/www/certbot \
  --email your-email@domain.com --agree-tos --no-eff-email \
  --force-renewal -d yourdomain.com
```

### 3. **Force Renewal with All Options**
```bash
docker compose -f docker-compose.ssl.yml --env-file .env.ssl run --rm certbot \
  certonly --webroot --webroot-path=/var/www/certbot \
  --email your-email@domain.com --agree-tos --no-eff-email \
  --force-renewal --verbose --debug --expand \
  -d yourdomain.com
```

### 4. **Use Staging Environment (Testing)**
```bash
docker compose -f docker-compose.ssl.yml --env-file .env.ssl run --rm certbot \
  certonly --webroot --webroot-path=/var/www/certbot \
  --email your-email@domain.com --agree-tos --no-eff-email \
  --staging --force-renewal -d yourdomain.com
```

## 🔧 Useful Certbot Flags

| Flag | Purpose |
|------|---------|
| `--force-renewal` | Force renew even if not expired |
| `--staging` | Use staging environment (testing) |
| `--verbose` | Show detailed output |
| `--debug` | Maximum debugging output |
| `--expand` | Add domains to existing certificate |
| `--dry-run` | Test without making changes |
| `--non-interactive` | Don't ask questions |

## 🚨 When to Use Each Method

### **Use `force` when:**
- Certificate expired
- Need to refresh certificate
- Regular renewal

### **Use `recreate` when:**
- Certificate is corrupted
- Getting "certificate not found" errors
- Previous renewal failed

### **Use `staging` when:**
- Testing configuration
- Hit rate limits (5 failures/hour)
- Debugging domain issues

### **Use `clean` when:**
- Everything is broken
- Multiple failed attempts
- Starting completely fresh

### **Use `verbose` when:**
- Need to debug what's failing
- Certificate request hangs
- Want detailed error messages

## 📋 Troubleshooting Checklist

Before force renewal, check:
- [ ] Domain DNS points to your server
- [ ] Ports 80 and 443 are open
- [ ] Nginx is running and accessible
- [ ] `.env.ssl` has correct domain/email

```bash
# Quick diagnosis
./debug-ssl.sh yourdomain.com

# Check current certificates
./force-renew-ssl.sh list

# Test domain accessibility
curl -I http://yourdomain.com/.well-known/acme-challenge/test
```

## 🎯 Rate Limits

**Let's Encrypt Limits:**
- 5 duplicate certificate failures per hour
- 50 certificates per domain per week
- 300 new orders per account per 3 hours

**To avoid rate limits:**
1. Use `--staging` for testing
2. Use `--dry-run` to test commands
3. Fix domain/DNS issues before retrying

## ⚡ Quick Fix for Common Issues

### Issue: "Certificate already exists"
```bash
./force-renew-ssl.sh force
```

### Issue: "Domain validation failed"  
```bash
# Check DNS first
dig yourdomain.com

# Then try recreation
./force-renew-ssl.sh recreate
```

### Issue: "Rate limit exceeded"
```bash
# Use staging for testing
./force-renew-ssl.sh staging

# Wait 1 hour, then try production
./force-renew-ssl.sh force
```

### Issue: "Everything is broken"
```bash
# Nuclear option
./force-renew-ssl.sh clean
```

## 🔄 After Successful Renewal

1. **Restart nginx:**
   ```bash
   docker compose -f docker-compose.ssl.yml restart dynaform-nginx
   ```

2. **Test the certificate:**
   ```bash
   curl -I https://yourdomain.com
   ```

3. **Verify WebAuthn works:**
   - Open https://yourdomain.com
   - Try passkey authentication
   - Should work without TLS errors! ✅

## 🎉 Success Indicators

- ✅ Certificate shows future expiration date
- ✅ Browser shows secure lock icon
- ✅ No TLS/SSL warnings
- ✅ WebAuthn/Passkeys work perfectly
- ✅ `https://yourdomain.com` loads correctly
