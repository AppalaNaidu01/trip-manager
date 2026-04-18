# 📄 Phase 2 PRD: Trip Planning and Personalization

> **Context Note**  
> This document builds on the foundations defined in:
> - `docs/initial-prd.md`
> - `docs/build-plan.md`  
>
> All decisions, architecture, and flows should remain consistent with those documents.

---

## 1. 🎯 Goal

Expand the MVP into a more complete **trip planning and personalization platform** by adding:

- Improved entry experience (Home + Login)
- Trip visual customization
- Routing capabilities
- Checklist functionality

This phase focuses on making the product:
- More useful **before the trip**
- More engaging **during usage**
- More polished overall

---

## 2. 📦 Phase 2 Scope

### 2.1 Home Page & Login Page Improvements
- Better content and messaging
- Visual enhancements (images, layout)
- Clear product explanation
- Strong call-to-action (CTA)

---

### 2.2 Trip Visual Customization
- Add **cover image**
- Add **background image**

---

### 2.3 Routing
- Add trip route details:
  - Start location
  - Destination
  - Stops
  - Notes
  - Distance / duration (manual for now)

---

### 2.4 Checklist
- Add checklist items
- Mark as complete/incomplete
- Optional assignment to members
- Categorization

---

## 3. 🧠 Feature Breakdown

---

### 3.1 Home Page Improvements

#### Features
- Hero section with strong messaging
- Product explanation
- Feature highlights:
  - Trip management
  - Expenses
  - Photos
  - Routing
  - Checklist
- “How it works” section
- CTA buttons:
  - Create Trip
  - Sign In
- Footer

#### Outcome
- Better first impression
- Improved onboarding clarity

---

### 3.2 Login Page Improvements

#### Features
- Split layout (image + login form)
- Short product description
- Benefits list:
  - Manage trips in one place
  - Track expenses
  - Share memories

#### Outcome
- Better context for users
- Improved trust and conversion

---

### 3.3 Trip Visual Customization

#### Requirements
- Upload cover image
- Upload background image
- Preview images
- Replace/update images
- Default fallback images

#### Usage
- Cover image → Trip card / header
- Background image → Trip dashboard

---

### 3.4 Routing Feature

#### MVP Scope
- Add:
  - Start location
  - Destination
  - Stops (ordered)
  - Notes
  - Distance text
  - Duration text

#### Design Decision
- Manual entry for Phase 2
- Map integration deferred to later phase

#### Display
- Route summary card
- Stops list
- Notes section

---

### 3.5 Checklist Feature

#### Core Features
- Add checklist item
- Mark complete/incomplete
- Categorize items
- Optional assignment

#### Suggested Categories
- Documents
- Safety
- Clothing
- Bike essentials
- Food / water
- Electronics

---

## 4. 🧱 Data Model Changes

---

### Trip (Update)

```ts
Trip {
  _id
  name
  description
  createdBy
  members
  coverImageUrl
  backgroundImageUrl
  startDate
  endDate
  createdAt
  updatedAt
}
Route
Route {
  _id
  tripId
  startLocation
  destination
  stops: [
    {
      name
      order
      notes
    }
  ]
  distanceText
  durationText
  routeNotes
  createdBy
  createdAt
  updatedAt
}
ChecklistItem (Recommended Structure)
ChecklistItem {
  _id
  tripId
  text
  category
  isCompleted
  assignedTo
  createdBy
  completedAt
  createdAt
  updatedAt
}
5. ⚙️ Backend Plan
5.1 Trip Image APIs
POST /api/trips/:tripId/cover-image
POST /api/trips/:tripId/background-image
PUT /api/trips/:tripId/images
5.2 Routing APIs
POST /api/trips/:tripId/route
GET /api/trips/:tripId/route
PUT /api/trips/:tripId/route
5.3 Checklist APIs
POST /api/trips/:tripId/checklist-items
GET /api/trips/:tripId/checklist-items
PATCH /api/checklist-items/:itemId
DELETE /api/checklist-items/:itemId
6. 🖥️ Frontend Plan
Home Page
Hero section
Feature sections
CTA
Visual design
Login Page
Split layout
Messaging + auth
Trip Settings
Upload cover image
Upload background image
Preview images
Route Section
Route summary card
Stops list
Notes
Checklist Section
Add item input
Checklist list
Completion toggle
Progress indicator
7. 🧭 UX Structure Update

Trip Dashboard Sections:

Overview
Expenses
Photos
Route
Checklist
Members
8. 🏗️ Implementation Priority
Priority 1: Checklist
High utility
Low complexity
Priority 2: Trip Images
High visual impact
Low backend complexity
Priority 3: Home & Login Pages
Improves product perception
Priority 4: Routing
Useful but slightly more complex
9. 👨‍💻 Engineering Tasks
Backend
Extend Trip schema
Add image upload handling
Create Route model + APIs
Create Checklist APIs
Frontend
Redesign home page
Redesign login page
Build checklist UI
Build route UI
Build image upload UI
Infra
Setup image upload (S3 or equivalent)
File validation (size/type)
URL storage
10. ⚠️ Risks & Considerations
Image handling complexity
Avoid overbuilding checklist into full task manager
Avoid early map API integration
Maintain simplicity
11. ✅ Definition of Done
Home page redesigned and deployed
Login page improved
Trip supports cover & background images
Routing feature available (manual input)
Checklist fully functional
Mobile responsiveness ensured
API + UI fully integrated
12. 📈 Expected Outcome

After Phase 2, the product should feel like:

A complete trip planning tool
Not just an expense/photo utility
Visually engaging
More useful before and during trips
13. 🏷️ Phase Name

Phase 2: Trip Planning and Personalization


---

If you want next, I can:
- Break this into **Jira tickets / task list**
- Or give you a **day-by-day execution plan (like sprint plan)**