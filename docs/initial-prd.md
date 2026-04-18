# 📄 Product Requirements Document (PRD)

## Product Name (Working): TripSync

---

## 1. 🧩 Problem Statement

Group trips (bike rides, casual outings, weekend trips) require users to switch between multiple apps for communication, expense tracking, and media sharing. This leads to:

- Fragmented information across platforms  
- Manual coordination overhead  
- Poor visibility of trip activities and expenses  
- Lack of a unified trip experience  

There is a need for a **single, integrated platform** that simplifies and centralizes trip management.

---

## 2. 🎯 Objective

Build a **simple web application** that allows users to:

- Manage a trip in one place  
- Collaborate with friends  
- Track expenses  
- Share memories  

**Core goal:** Reduce tool-switching and improve trip experience

---

## 3. 👤 Target Users

- Friends going on bike rides  
- College groups / hostel groups  
- Small travel groups (2–10 people)  

---

## 4. 🧱 Core Concept

Everything revolves around a **“Trip” entity**

Each trip contains:
- Members  
- Expenses  
- Media (photos/videos)  
- Activity timeline  

---

## 5. 🚀 MVP Scope (Version 1)

### 5.1 Trip Management
- Create a trip  
- Add trip name, date, description  
- Invite members via link  

---

### 5.2 Members
- Join via invite link  
- View all members in the trip  
- Basic roles (optional for v1):
  - Admin (creator)  
  - Member  

---

### 5.3 Expense Tracking
- Add expense:
  - Amount  
  - Paid by  
  - Split between members  
  - Category (fuel, food, stay – optional v1)  

- View all expenses in list  
- Show total spent  
- Show individual balances  

---

### 5.4 Media Sharing
- Upload photos  
- View shared photos in a gallery  
- Associate uploads with trip  

---

### 5.5 Timeline (Core Feature)
A unified activity feed showing:
- Expense added  
- Photo uploaded  
- Member joined  

---

## 6. 📱 User Flow (High Level)

### Create Trip
1. User creates trip  
2. Gets invite link  
3. Shares link  

---

### Join Trip
1. User opens link  
2. Joins trip  
3. Sees dashboard  

---

### During Trip
- Add expenses quickly  
- Upload photos  
- View updates in timeline  

---

### After Trip
- Check balances  
- View photos  
- Close trip  

---

## 7. 🧠 Key Features (Differentiation)

- Single Trip Dashboard  
- Timeline View (Core USP)  
- Low friction usage (fast add expense, quick upload)  

---

## 8. ⚙️ Functional Requirements

### Trip
- Create / Read trips  
- Generate unique invite link  

---

### Members
- Join via link  
- List members  

---

### Expenses
- CRUD expenses  
- Split logic (equal split for MVP)  
- Balance calculation  

---

### Media
- Upload files  
- Store URLs (S3 or similar)  
- Fetch and display  

---

### Timeline
- Log events:
  - Expense added  
  - Media uploaded  
  - Member joined  

---

## 9. 📊 Non-Functional Requirements

- Fast loading (<2s basic pages)  
- Mobile-friendly UI  
- Simple onboarding (no friction)  
- Scalable backend (basic level for MVP)  

---

## 10. 🏗️ Suggested Tech Stack

Frontend:
- Next.js  

Backend:
- Node.js (Next API routes)  

Database:
- Firebase  

Storage:
- Firebase

Auth:
- Firebase OAuth - google

---

## 11. 📦 Data Model (Basic)

### Trip
- id  
- name  
- description  
- createdBy  
- members[]  

---

### Member
- userId  
- name  
- joinedAt  

---

### Expense
- id  
- tripId  
- amount  
- paidBy  
- splitBetween[]  
- createdAt  

---

### Media
- id  
- tripId  
- uploadedBy  
- url  
- createdAt  

---

### TimelineEvent
- id  
- tripId  
- type (expense | media | member)  
- referenceId  
- createdAt  

---

## 💡 Final Note

The goal is not to replace individual tools, but to create a **seamless, trip-centric experience** where everything lives in one place.