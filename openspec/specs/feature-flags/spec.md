# feature-flags Specification

## Purpose
Lets the deployment administrator switch shipped features on and off from one server-owned registry, so a feature can be withdrawn for a deployment without shipping new client code, and so an end user can never enable a feature for themselves.

## Requirements

### Requirement: Flags are owned by the deployment administrator

The API SHALL publish a registry of feature flags whose values are held server-side and owned by the deployment administrator. Each registered flag SHALL have a stable key, an enabled state, a human-readable label, and a description of the feature it gates. The signed-in user SHALL NOT own, edit or override any flag value.

#### Scenario: The registry is published to clients

- **WHEN** a client requests the feature-flag registry
- **THEN** the response carries the enabled state of every registered flag keyed by its stable key

#### Scenario: A flag carries a label and description

- **WHEN** an administrator inspects the registry
- **THEN** each flag has a label and a description naming the feature it gates

#### Scenario: Flags are not stored per user

- **WHEN** two different signed-in users read the registry
- **THEN** both receive the same flag values

### Requirement: Flag values cannot be changed by a user

No API route SHALL allow a signed-in user to change, enable or disable a flag value, and no client-supplied field SHALL influence the value a flag resolves to. A request that attempts to do so SHALL be rejected with `403` and the JSON error envelope, and the stored value SHALL be unchanged.

#### Scenario: A write attempt is refused

- **WHEN** a signed-in user sends a request that attempts to set a flag value
- **THEN** the API responds `403` with the JSON error envelope
- **AND** the stored flag value is unchanged

#### Scenario: Client input does not steer a flag

- **WHEN** a client sends a flag key or flag value in the body of an unrelated request
- **THEN** the flag resolves to the value held by the registry

### Requirement: An unregistered key resolves to disabled

A flag key that the registry does not contain SHALL resolve to disabled, and SHALL NOT be reported as enabled by default. Clients SHALL ignore flag keys they do not recognise rather than failing.

#### Scenario: An unknown key is not enabled

- **WHEN** a flag key that was never registered is evaluated
- **THEN** it resolves to disabled

#### Scenario: An unknown key does not break the client

- **WHEN** the registry contains a key the client does not recognise
- **THEN** the client ignores that key and renders normally

### Requirement: The registry fails open on an infrastructure error

When the registry cannot be read because of an infrastructure failure, every registered flag SHALL resolve to enabled so that a transient failure never hides a working feature. The failure SHALL be recorded in the server logs.

#### Scenario: A read failure does not hide the feature

- **WHEN** the registry cannot be read and a client requests the flags
- **THEN** every registered flag is reported as enabled
- **AND** the failure is recorded in the server logs

### Requirement: A disabled feature is unavailable end to end

While a flag that gates a feature is disabled, that feature SHALL be unavailable to every user of the deployment: the navigation entry that leads to it SHALL NOT be rendered, the screen SHALL NOT be reachable by URL, and the API route that serves it SHALL respond `404` with the JSON error envelope.

#### Scenario: The navigation entry disappears

- **WHEN** a flag that gates a navigation destination is disabled
- **THEN** no navigation entry links to that destination

#### Scenario: The screen is refused by URL

- **WHEN** a user opens the URL of a screen whose flag is disabled
- **THEN** the client does not render that screen
- **AND** the API route that backs it responds `404` with the JSON error envelope

#### Scenario: Re-enabling restores the feature

- **WHEN** the administrator enables the flag again
- **THEN** the navigation entry is rendered again
- **AND** the screen and its API route are available again

### Requirement: Gated configuration is not readable or writable while disabled

While the flag that gates a configuration section is disabled, the API SHALL NOT return the values held by that section and SHALL reject writes to it with `403` and the JSON error envelope. The client SHALL NOT render the section.

#### Scenario: The gated values are withheld

- **WHEN** the flag that gates the UPI configuration is disabled
- **THEN** the settings response omits the UPI ID and the payee name

#### Scenario: A write to the gated section is refused

- **WHEN** the flag that gates the UPI configuration is disabled and a client submits a UPI ID
- **THEN** the API responds `403` with the JSON error envelope
- **AND** the stored configuration is unchanged

#### Scenario: The section is not rendered

- **WHEN** the flag that gates the UPI configuration is disabled
- **THEN** neither the web Settings screen nor the mobile Profile screen renders the UPI configuration form

### Requirement: Flags are administered without a client release

An administrator SHALL be able to add a flag, change its enabled state and withdraw it without shipping a new client, and a client SHALL pick up a changed flag value within a bounded time of the change without the user having to reload the application.

#### Scenario: A flag is added at run time

- **WHEN** an administrator adds a new flag to the registry
- **THEN** the flag becomes part of the published registry
- **AND** no client release is required for it to be readable

#### Scenario: A flag change is picked up

- **WHEN** an administrator changes a flag's enabled state
- **THEN** a client that re-reads the registry within its bounded refresh window observes the new state

#### Scenario: The administrator procedure is documented

- **WHEN** an administrator needs to switch a feature off
- **THEN** the documented procedure shows how to change the flag value and how to confirm the new state
