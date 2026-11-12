# Spec Delta

## ADDED Requirements

### Requirement: Profile identity header shows the account avatar

The Profile screen SHALL render the signed-in account's OAuth profile image in the identity header when the account provides one, and SHALL fall back to the user's initials when the image is absent or fails to load. The header SHALL show the profile image, the display name, the email address, and the connected-Google state.

#### Scenario: Account provides a profile image

- **WHEN** a signed-in user with a Google profile image opens the Profile screen
- **THEN** the identity header shows that profile image together with the user's name and email

#### Scenario: Profile image fails to load

- **WHEN** the account provides a profile image that cannot be loaded
- **THEN** the identity header shows the user's initials instead, with no broken or empty image frame

#### Scenario: Account has no profile image

- **WHEN** the signed-in account has no profile image
- **THEN** the identity header shows the user's initials instead of an image

#### Scenario: Profile image is not blurry

- **WHEN** the account's profile image is displayed in the identity header
- **THEN** the app requests a display-size variant of that image rather than the small default variant

#### Scenario: Identity follows the refreshed session

- **WHEN** the session is refreshed after sign-in and the account provides a name and a profile image
- **THEN** the identity header shows the refreshed name and profile image rather than placeholder copy
