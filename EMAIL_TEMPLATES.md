# Email Templates Documentation

This document describes the styled email templates used in the Brandmeister Lastheard Next Generation API system.

## Overview

All email templates use a consistent design language with:
- Purple gradient header matching the website design (#667eea to #764ba2)
- Professional HTML email structure for broad email client compatibility
- Responsive design that works on desktop and mobile
- Clear call-to-action buttons
- Informational boxes with appropriate colors (warning, info, etc.)

## 1. Email Verification Template

**Subject:** Verify your email for Brandmeister Lastheard API

**Purpose:** Sent when a user requests an API key. Contains a verification link that expires in 24 hours.

**Key Features:**
- Purple gradient header with Brandmeister branding
- Large "Verify Email Address" button with gradient background
- Warning box highlighting 24-hour expiration
- Plain text link as fallback for email clients that don't support buttons
- Footer with branding and automated email notice

**Visual Elements:**
- Gradient header: Purple (#667eea) to purple (#764ba2)
- Primary button: Same gradient as header
- Warning box: Yellow background (#fff3cd) with dark yellow text (#856404)
- Footer: Light gray background (#f8f9fa)

## 2. API Key Email Template

**Subject:** Your Brandmeister Lastheard API Key

**Purpose:** Sent after successful email verification. Contains the user's API key and usage instructions.

**Key Features:**
- Celebratory 🎉 emoji in header
- API key displayed in a dashed border box
- Expiry date clearly shown (Valid until: [Date])
- Warning box about keeping the key secure
- Code example showing how to use the API key
- Link to API documentation

**Visual Elements:**
- Gradient header: Purple (#667eea) to purple (#764ba2)
- API key box: Light background (#f8f9fa) with dashed purple border (#667eea)
- Expiry info: Gray background (#f0f0f0)
- Warning box: Yellow background (#fff3cd)
- Info box: Light blue background (#e7f3ff) with blue border (#667eea)
- Code block: Dark background (#2d2d2d) with white text

## 3. Expiry Reminder Email Template

**Subject:** Your Brandmeister API Key Expires in [X] Days

**Purpose:** Sent 30, 15, and 5 days before API key expiration. Reminds users to request a new key.

**Key Features:**
- Clock emoji (⏰) in header indicating urgency
- Orange/yellow gradient header for warning tone
- Large expiration date display in warning box
- "Request New API Key" call-to-action button
- Tip box with helpful reminder

**Visual Elements:**
- Gradient header: Yellow (#ffc107) to orange (#ff9800)
- Warning box: Yellow background (#fff3cd) with bold date display
- Primary button: Purple gradient (matching other emails)
- Info box: Light blue background (#e7f3ff) with blue border

## Technical Details

### Email Structure
All emails use HTML tables for layout to ensure maximum compatibility with email clients:
- Outer table: 100% width with background color
- Inner table: 600px fixed width for content
- All inline CSS (no external stylesheets)
- Fallback plain text version included

### Responsive Design
- Max-width container adapts to smaller screens
- Padding adjusts for mobile viewing
- Text remains readable on all devices

### Accessibility
- Semantic HTML structure
- Sufficient color contrast
- Plain text alternatives
- Clear headings hierarchy

## Color Palette

Primary Colors:
- Purple: #667eea
- Dark Purple: #764ba2
- Yellow/Warning: #ffc107
- Orange: #ff9800

Background Colors:
- Light Gray: #f8f9fa
- Light Blue: #e7f3ff
- Light Yellow: #fff3cd
- Dark Gray (code): #2d2d2d

Text Colors:
- Primary Text: #333333
- Secondary Text: #666666
- Light Text: #999999
- Warning Text: #856404

## Implementation Notes

All email templates are implemented in `/src/services/emailService.js`:
- `sendVerificationEmail()` - Verification email
- `sendApiKeyEmail()` - API key delivery email  
- `sendExpiryReminderEmail()` - Expiry reminder email

Each function includes both HTML and plain text versions for maximum compatibility.
