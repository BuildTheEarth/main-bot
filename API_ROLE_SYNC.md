# Role Sync API Documentation

## Overview

The Role Sync API allows the BuildTheEarth website to automatically synchronize Discord roles with website roles. This API endpoint enables adding or removing Discord roles from users in both main and staff servers based on a key-based whitelist configuration.

## Configuration

### Whitelist Setup

Before using the API, configure the allowed roles in the whitelist file:

**File Location:** `config/extensions/allowedRolesToAdd.json5`

**Format:**
```json5
{
    "buildteam_owner": {
        "main": "711265706494132234",    // Role ID in main Discord
        "staff": "730642056564834346"    // Role ID in staff Discord
    },
    "buildteam_staff": {
        "main": "691343715117039666",
        "staff": undefined                // No role in staff Discord
    },
    "bte_staff": {
        "main": "722561286352928888",
        "staff": "722561286352928888"
    }
}
```

Each key represents a role type that can be synced from the website. The value is an object mapping to role IDs in the main and staff Discord servers. Either `main` or `staff` can be `undefined` if the role doesn't exist in that server.

Only role keys included in this whitelist can be modified via the API. This ensures security and prevents unauthorized role modifications.

## API Endpoint

### POST `/api/v1/role/:id`

Adds or removes Discord roles from a user in both main and staff Discord servers.

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
    "buildteam_owner",
    "bte_staff"
  ]
}
```

- `add` (boolean, required): 
  - `true` to add roles to the user
  - `false` to remove roles from the user
- `roles` (array of strings, required): Array of role keys to add or remove
  - All role keys must be present in the whitelist configuration
  - The bot will apply the corresponding role IDs to both main and staff servers where defined

#### Response

**Success (200 OK):**
```json
{
  "userId": "635411595253776385",
  "operation": "add",
  "results": {
    "main": {
      "success": ["buildteam_owner", "bte_staff"],
      "failure": []
    },
    "staff": {
      "success": ["buildteam_owner", "bte_staff"],
      "failure": []
    }
  }
}
```

**Partial Success (200 OK):**
```json
{
  "userId": "635411595253776385",
  "operation": "add",
  "results": {
    "main": {
      "success": ["buildteam_owner"],
      "failure": [
        {
          "roleKey": "bte_staff",
          "error": "Missing Permissions"
        }
      ]
    },
    "staff": {
      "success": ["buildteam_owner", "bte_staff"],
      "failure": []
    }
  }
}
```

#### Error Responses

**400 Bad Request - Missing Parameters:**
```json
{
  "error": "MISSING_PARAMETER",
  "message": "Missing parameter: roles (array of role keys)"
}
```

**403 Forbidden - Role Key Not in Whitelist:**
```json
{
  "error": "FORBIDDEN",
  "message": "One or more role keys are not allowed to be modified",
  "invalidRoles": ["unknown_role_key"]
}
```

**404 Not Found - User Not Found:**
```json
{
  "error": "NOT_FOUND",
  "message": "User not found in any guild"
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
    "roles": ["buildteam_owner", "bte_staff"]
  }'
```

### Removing Roles from a User

```bash
curl -X POST https://bot.buildtheearth.net/api/v1/role/635411595253776385 \
  -H "Authorization: Bearer YOUR_INTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "add": false,
    "roles": ["buildteam_staff"]
  }'
```

### JavaScript/TypeScript Example

```typescript
async function syncUserRoles(userId: string, roleKeys: string[], add: boolean) {
  const response = await fetch(`https://bot.buildtheearth.net/api/v1/role/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.INTER_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      add: add,
      roles: roleKeys
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
    ['buildteam_owner', 'bte_staff'],
    true
  );
  console.log('Main guild - Success:', result.results.main.success);
  console.log('Staff guild - Success:', result.results.staff.success);
  if (result.results.main.failure.length > 0) {
    console.error('Main guild - Failed roles:', result.results.main.failure);
  }
  if (result.results.staff.failure.length > 0) {
    console.error('Staff guild - Failed roles:', result.results.staff.failure);
  }
} catch (error) {
  console.error('Error syncing roles:', error);
}
```

## Security Considerations

1. **Whitelist Configuration**: Only role keys explicitly added to `allowedRolesToAdd.json5` can be modified
2. **Key-Based Mapping**: Role IDs are never exposed to the API caller, only role keys are used
3. **Authentication**: All requests must include a valid Bearer token
4. **IP Whitelisting**: The API respects the configured IP whitelist for additional security
5. **Audit Trail**: All role modifications are logged for audit purposes
6. **Multi-Server Support**: Automatically applies roles to both main and staff servers where configured

## Integration with BuildTheEarth Website

The website should call this API endpoint whenever:
- A user's role changes on the website (e.g., promoted to BuildTeam Staff)
- BuildTeam ownership changes
- BTE Staff status changes

This creates a "push" synchronization system where the website drives the role updates, ensuring Discord roles stay in sync with website permissions across both main and staff servers.

## Troubleshooting

### Role Modification Fails

1. **Check Whitelist**: Ensure the role key is in `config/extensions/allowedRolesToAdd.json5`
2. **Check Role Mapping**: Verify the role key has valid role IDs for the appropriate servers
3. **Bot Permissions**: Verify the bot has permission to manage the role in both servers
4. **Role Hierarchy**: The bot's role must be higher than the role being modified in each server
5. **User in Server**: The user must be a member of at least one of the servers (main or staff)

### Authentication Errors

1. Verify the `INTER_KEY` is correctly configured in the bot's environment
2. Ensure the Bearer token in the Authorization header matches the configured key
3. Check if your IP address is in the API whitelist

## Related Documentation

- [Swagger API Documentation](https://buildtheearth.github.io/main-bot/)
- [Installation Guide](installation.md)
- [Main README](readme.md)
