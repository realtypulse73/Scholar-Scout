# ScholarScout API Spec

## MVP Endpoints

### `GET /health`

Returns service health metadata.

### `GET /programs`

Returns all scholarship programs.

### `POST /users`

Creates a base user record.

Request body:

```json
{
  "id": "clerk_user_id",
  "email": "student@example.com"
}
```

### `POST /users/clerk-sync`

Creates or updates a user record from a Clerk-authenticated identity.

### `POST /student-profiles`

Creates or updates a student profile.

Request body:

```json
{
  "userId": "clerk_user_id",
  "gpa": 3.8,
  "interests": ["Computer Science", "Engineering"],
  "location": "New York"
}
```

### `GET /student-profiles/user/:userId`

Returns the current profile for a Clerk-backed user id.

### `POST /programs`

Creates a scholarship program.

Request body:

```json
{
  "name": "Women in STEM Grant",
  "school": "Northstar University",
  "minGpa": 3.2,
  "maxGpa": 4,
  "location": "New York",
  "field": "Computer Science"
}
```

### `POST /match`

Finds matching scholarship programs for a student profile.

Request body:

```json
{
  "studentProfileId": "uuid",
  "limit": 10
}
```

Response body:

```json
{
  "studentProfileId": "uuid",
  "totalProgramsConsidered": 18,
  "matches": [
    {
      "programId": "uuid",
      "programName": "Women in STEM Grant",
      "score": 91,
      "reasons": [
        "GPA fits program range",
        "Program field matches student interests",
        "Location preference is an exact match"
      ]
    }
  ]
}
```

Score formula for the MVP:

- `GPA fit`
- `program match`
- `location preference`

### `GET /notifications/:userId`

Returns inbox and notification items for a user.

### `POST /notifications`

Creates a persisted notification record and emits a realtime alert over WebSockets.

### `PATCH /notifications/:id/read`

Marks a notification as read.

### `GET /messages/conversations/:userId`

Returns conversations for a user, including ordered messages.

### `POST /messages/conversations`

Creates a conversation.

Request body:

```json
{
  "participantIds": ["clerk_user_id", "school_user_id"]
}
```

### `POST /messages`

Creates a persisted message and emits a realtime inbox event to conversation participants.

Request body:

```json
{
  "conversationId": "conversation_id",
  "senderId": "clerk_user_id",
  "body": "Thanks for your interest. Here is the next step."
}
```

### `PATCH /messages/:id/read`

Marks a message as read.

## Auth

The MVP frontend uses Clerk for authentication. Backend routes are prepared to accept authenticated user context from Clerk-managed sessions or tokens in a later hardening pass.
