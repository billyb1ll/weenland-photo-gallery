# Admin Login Credentials

## Default Admin Credentials

**Username:** `admin`
**Password:** `weenland2024`

## How to Change the Password

1. Run the password hash generator:
```bash
node scripts/generate-hash.js
```

2. Set the environment variables:
```bash
export ADMIN_USERNAME="your_username"
export ADMIN_PASSWORD_HASH="your_generated_hash"
```

3. Or add them to your `.env.local` file:
```
ADMIN_USERNAME=your_username
ADMIN_PASSWORD_HASH=your_generated_hash
JWT_SECRET=your_secret_key_here
```

## Testing the Login

1. Click the "Admin Login" button in the top-right corner
2. Enter username: `admin`
3. Enter password: `weenland2024`
4. Click "Login"

The admin panel should appear with upload, sync, and management features.
