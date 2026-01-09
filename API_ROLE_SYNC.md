# Role Sync API Documentation

## Overview

The Role Sync API allows the BuildTheEarth website to automatically synchronize Discord roles with website roles. This API endpoint enables adding or removing Discord roles from users based on a whitelist configuration.

## Configuration

### Whitelist Setup

Before using the API, configure the allowed roles in the whitelist file:

**File Location:** `config/extensions/allowedRolesToAdd.json5`

**Format:**
```json5
[
    "692504956036710440",  // Example Role ID 1
    "711265706494132234",  // Example Role ID 2
    "691343715117039666"   // Example Role ID 3
]
```

Only role IDs included in this whitelist can be modified via the API. This ensures security and prevents unauthorized role modifications.

## API Endpoint

### POST `/api/v1/role/:id`

Adds or removes Discord roles from a user.

#### Authentication

All API requests require Bearer token authentication:

```
Authorization: Bearer <INTER_KEY>
```

The `INTER_KEY` must match the key configured in the bot's environment variables.

#### Request Parameters

**Path Parameters:**
- `id` (string, required): The Discord Snowflake User ID of the target user
  - Example: `635411595253776385`

**Request Body:**
```json
{
  "add": true,
  "roles": [
    "692504956036710440",
    "711265706494132234"
  ]
}
```

- `add` (boolean, required): 
  - `true` to add roles to the user
  - `false` to remove roles from the user
- `roles` (array of strings, required): Array of Discord role IDs to add or remove
  - All role IDs must be present in the whitelist configuration

#### Response

**Success (200 OK):**
```json
{
  "userId": "635411595253776385",
  "operation": "add",
  "results": {
    "success": [
      "692504956036710440",
      "711265706494132234"
    ],
    "failure": []
  }
}
```

**Partial Success (200 OK):**
```json
{
  "userId": "635411595253776385",
  "operation": "add",
  "results": {
    "success": [
      "692504956036710440"
    ],
    "failure": [
      {
        "roleId": "711265706494132234",
        "error": "Missing Permissions"
      }
    ]
  }
}
```

#### Error Responses

**400 Bad Request - Missing Parameters:**
```json
{
  "error": "MISSING_PARAMETER",
  "message": "Missing parameter: roles (array of role IDs)"
}
```

**403 Forbidden - Role Not in Whitelist:**
```json
{
  "error": "FORBIDDEN",
  "message": "One or more roles are not allowed to be modified",
  "invalidRoles": ["999999999999999999"]
}
```

**404 Not Found - User Not Found:**
```json
{
  "error": "NOT_FOUND",
  "message": "Not found: user"
}
```

**503 Service Unavailable - Whitelist Not Configured:**
```json
{
  "error": "SERVICE_UNAVAILABLE",
  "message": "Role whitelist is not configured or empty"
}
```

## Usage Examples

### Adding Roles to a User

```bash
curl -X POST https://bot.buildtheearth.net/api/v1/role/635411595253776385 \
  -H "Authorization: Bearer YOUR_INTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "add": true,
    "roles": ["692504956036710440", "711265706494132234"]
  }'
```

### Removing Roles from a User

```bash
curl -X POST https://bot.buildtheearth.net/api/v1/role/635411595253776385 \
  -H "Authorization: Bearer YOUR_INTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "add": false,
    "roles": ["692504956036710440"]
  }'
```

### JavaScript/TypeScript Example

```typescript
async function syncUserRoles(userId: string, roleIds: string[], add: boolean) {
  const response = await fetch(`https://bot.buildtheearth.net/api/v1/role/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.INTER_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      add: add,
      roles: roleIds
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${error.message}`);
  }
  
  return await response.json();
}

// Usage
try {
  const result = await syncUserRoles(
    '635411595253776385',
    ['692504956036710440', '711265706494132234'],
    true
  );
  console.log('Roles added:', result.results.success);
  if (result.results.failure.length > 0) {
    console.error('Failed roles:', result.results.failure);
  }
} catch (error) {
  console.error('Error syncing roles:', error);
}
```

## Security Considerations

1. **Whitelist Configuration**: Only roles explicitly added to `allowedRolesToAdd.json5` can be modified
2. **Authentication**: All requests must include a valid Bearer token
3. **IP Whitelisting**: The API respects the configured IP whitelist for additional security
4. **Audit Trail**: All role modifications are logged for audit purposes

## Integration with BuildTheEarth Website

The website should call this API endpoint whenever:
- A user's role changes on the website (e.g., promoted to BuildTeam Staff)
- BuildTeam ownership changes
- BTE Staff status changes

This creates a "push" synchronization system where the website drives the role updates, ensuring Discord roles stay in sync with website permissions.

## Troubleshooting

### Role Modification Fails

1. **Check Whitelist**: Ensure the role ID is in `config/extensions/allowedRolesToAdd.json5`
2. **Bot Permissions**: Verify the bot has permission to manage the role
3. **Role Hierarchy**: The bot's role must be higher than the role being modified
4. **User in Server**: Ensure the user is a member of the main BuildTheEarth Discord server

### Authentication Errors

1. Verify the `INTER_KEY` is correctly configured in the bot's environment
2. Ensure the Bearer token in the Authorization header matches the configured key
3. Check if your IP address is in the API whitelist

## Related Documentation

- [Swagger API Documentation](https://buildtheearth.github.io/main-bot/)
- [Installation Guide](installation.md)
- [Main README](readme.md)
