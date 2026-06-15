# Our Story - Frontend Integration Guide

This document provides everything a frontend developer needs to integrate with the "Our Story" backend API.

---

## 🔐 1. Authentication & API Standards

### Base URL
`https://your-api-domain.com/api`

### Auth Header
All protected endpoints require the Firebase/Supabase JWT in the header:
```http
Authorization: Bearer <JWT_TOKEN>
```

### Response Format
The API follows a standardized JSON response pattern:
- **Success**: `{ data: <any|array>, nextCursor?: string | null }`
- **Error**: `{ error: { code: string, message: string } }`

### Common HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource (like a couple or message) was created.
- `400 Bad Request`: Validation error or missing parameters.
- `401 Unauthorized`: Token missing or expired.
- `403 Forbidden`: Admin privileges required or user doesn't belong to the couple.
- `404 Not Found`: Resource (note, message, etc.) not found.
- `500 Internal Error`: Database or Email failure.

---

## 📂 2. Endpoint Reference

### User & Authentication
| Method | Endpoint | Description | Body / Params |
| :--- | :--- | :--- | :--- |
| **GET** | `/user/profile` | Current user info | N/A |
| **PATCH** | `/user/profile` | Update display name/avatar | `{ displayName, avatarUrl }` |
| **DELETE** | `/user/account` | Permanent wipe | `{ password }` (Confirmation) |
| **POST** | `/auth/logout` | Logout & clear sessions | N/A |

### Couple Management
| Method | Endpoint | Description | Body / Params |
| :--- | :--- | :--- | :--- |
| **POST** | `/ml-couple/create` | Start pending couple | `{ partnerEmail? }` |
| **PATCH** | `/ml-couple/profile` | Update Anniversary | `{ anniversaryDate }` |
| **POST** | `/ml-couple/invite/resend` | Resend invite email | `{ partnerEmail }` |
| **DELETE** | `/ml-couple` | Dissolve connection | N/A |

### Chat System
| Method | Endpoint | Description | Body / Params |
| :--- | :--- | :--- | :--- |
| **GET** | `/ml-chat/message/:id` | Get message + replies | `:id` of message |
| **PATCH** | `/ml-chat/message/:id` | Edit (5 min window) | `{ content }` |
| **DELETE** | `/ml-chat/message/:id` | Soft delete | N/A |

### Features (Jar, Notes, Prayers)
All feature list endpoints support **Pagination** via `?cursor=&limit=`.

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Jar** | **GET** | `/ml-jar/all` | List all memories |
| **Jar** | **DELETE** | `/ml-jar/:id` | Remove entry |
| **Notes** | **GET** | `/ml-notes/:id` | Fetch full note |
| **Notes** | **PATCH** | `/ml-notes/:id` | Update title/content |
| **Notes** | **DELETE** | `/ml-notes/:id` | Soft delete |
| **Prayers** | **PATCH** | `/ml-prayer/:id` | Edit content/category |

---

## 🤖 3. AI & Spiritual Features

### Daily Content
- **Verse History**: `GET /api/ml-verse/history` (Paginated list of past daily verses).
- **Topic History**: `GET /api/ml-discussion/history` (Past AI-generated discussion topics).

### Favorites
- **POST** `/api/ml-verse/favorite/:verseId`: Toggles favorited status for a verse for that couple.

---

## ⚡ 4. Real-time Integration (Supabase)
The frontend should subscribe to the following tables using the Supabase Client for live updates:

1. **`Message`**: For instant chat delivery and status updates.
2. **`Notification`**: For real-time in-app alerts.

**Example (JS/TS)**:
```typescript
supabase
  .channel('chat-room')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Message' }, payload => {
    console.log('New message!', payload.new)
  })
  .subscribe()
```

---

## 🛠️ 5. Admin Panel
Requires a user with `role === 'admin'`.

- **User Oversight**: `GET /api/admin/users`: Search and manage users.
- **Analytics**: `GET /api/admin/stats`: Get engagement metrics and registration charts.
- **Moderation**: `POST /api/admin/reports/:id/resolve`: Act on reported content.
- **Announcements**: `POST /api/admin/announcement`: Create messages for all users.

---

## 📊 6. Data Handling Tips
1. **Soft Deletes**: Files are often marked `deletedAt` or `isDeleted`. The API handles filtering these out by default.
2. **Dates**: All dates are returned as ISO-8601 strings.
3. **Cursor Pagination**: Use the `nextCursor` value from the response to fetch the next page: `GET /api/ml-jar/all?cursor=UUID_HERE&limit=20`.
