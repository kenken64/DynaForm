# DynaForm PDF Converter Permission Fix Instructions

## Problem
The PDF converter is getting "Permission denied" errors when trying to create UUID directories in the `generated_pngs` folder:
```
PermissionError: [Errno 13] Permission denied: 'generated_pngs/ff056e22-2efd-476b-98fb-54aae0c8c7e4'
```

## Root Cause
The Docker container running the PDF converter service cannot write to the mounted `generated_pngs` directory due to user/permission mismatches between the host and container.

## Fix Applied
1. **Host Directory Permissions**: Set `./pdf-png/generated_pngs/` to `777` permissions
2. **Updated Dockerfile**: Modified to run with proper permission handling
3. **Added Entrypoint Script**: Created `docker-entrypoint.sh` to ensure correct permissions

## Steps to Apply Fix

### Option 1: Quick Fix (Host Permissions Only)
```bash
# Already applied - directory permissions set to 777
chmod 777 ./pdf-png/generated_pngs/
```

### Option 2: Complete Fix (Rebuild Container)
Run the following scripts in order:

1. **Test current permissions:**
```bash
./test-pdf-permissions.sh
```

2. **Apply complete fix:**
```bash
./fix-pdf-permissions.sh
```

### Option 3: Manual Docker Commands
If you have Docker available:
```bash
# Stop and rebuild PDF converter
docker compose -f docker-compose.ssl.yml stop pdf-converter
docker compose -f docker-compose.ssl.yml rm -f pdf-converter  
docker compose -f docker-compose.ssl.yml build --no-cache pdf-converter
docker compose -f docker-compose.ssl.yml up -d pdf-converter
```

## Verification
After applying the fix, try uploading a PDF file. The conversion should work without permission errors.

## Files Modified
- `./pdf-png/generated_pngs/` - Set to 777 permissions
- `./pdf-png/Dockerfile` - Updated to handle permissions
- `./pdf-png/docker-entrypoint.sh` - New entrypoint script
- Created fix scripts: `fix-pdf-permissions.sh`, `test-pdf-permissions.sh`

## Current Status
✅ Host directory permissions fixed (777)
⏳ Container needs restart to apply changes
🧪 Ready for testing
