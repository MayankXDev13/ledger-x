# user-profile Specification

## Purpose

Displays the signed-in user's real identity (OAuth profile image, name, email) inline in the web app, replacing the dedicated profile page and email-derived placeholders.

## Requirements

### Requirement: Profile page is removed in favor of inline identity display

The web app SHALL NOT provide a dedicated `/profile` page, and no navigation element SHALL link to it. Wherever app navigation references the profile page, it SHALL be replaced with the inline identity surfaces defined by this capability.

#### Scenario: Profile route no longer exists

- **WHEN** a signed-in user opens the URL that previously served the profile page
- **THEN** no `/profile` route exists in the app

#### Scenario: No navigation links to the profile page

- **WHEN** the user views the desktop sidebar or the mobile bottom navigation
- **THEN** no item links to the removed profile page

### Requirement: Identity chip shows OAuth profile image and first name

The desktop sidebar user chip SHALL display the user's profile image from the authenticated identity when one is present, falling back to initials when it is absent or fails to load. The chip SHALL display the user's first name (the first word of the authenticated identity's `name`), falling back to the email local-part when `name` is absent.

#### Scenario: Chip shows profile image and first name

- **WHEN** a signed-in user with a synced Google name and image views the desktop sidebar
- **THEN** the user chip renders the profile image and the first word of the user's name instead of email-derived initials and local-part

#### Scenario: Fallbacks when image or name are missing

- **WHEN** an authenticated user has no profile image or no name
- **THEN** the chip falls back to initials and to the email local-part respectively, without crashing or rendering empty content

### Requirement: Hover identity card shows profile image, name, and email

Hovering (and for keyboard and touch users, clicking or focusing) the sidebar user chip SHALL reveal an identity card that shows the user's profile image, the user's name, and the user's email, with image and name falling back as in the chip. The card SHALL provide the Sign out action previously reachable through the chip's dropdown menu.

#### Scenario: Hovering the chip reveals the identity card

- **WHEN** a signed-in user hovers over the sidebar user chip
- **THEN** a card appears showing the profile image, the user's name, and the user's email

#### Scenario: Card is reachable without a pointer

- **WHEN** a keyboard user focuses the chip, or a touch user taps it
- **THEN** the identity card opens and can be dismissed without leaving the page

#### Scenario: Sign out remains available

- **WHEN** the user activates Sign out from the identity card
- **THEN** the session is signed out as before and the user is returned to the sign-in flow

### Requirement: Mobile keeps account access without the profile page

The mobile app navigation SHALL provide an inline account entry that shows the user's avatar and first name and, when activated, presents the profile image, name, and email with a Sign out action, so that removing the profile page does not remove mobile account access.

#### Scenario: Mobile account entry replaces the settings link

- **WHEN** a signed-in mobile user opens the bottom navigation
- **THEN** no item links to `/profile`, and an account item shows the avatar and first name

#### Scenario: Mobile account view shows identity and sign out

- **WHEN** the mobile user activates the account item
- **THEN** a view displays the profile image, name, and email and offers Sign out
