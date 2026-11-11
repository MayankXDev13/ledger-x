# Spec Delta: feature-flags

## MODIFIED Requirements

### Requirement: Gated configuration is not readable or writable while disabled

While the flag that gates a configuration section or sensitive utility is disabled, the API SHALL NOT return the values held by that section and SHALL reject writes to it with `403` and the JSON error envelope. The client SHALL NOT render the gated section.

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

#### Scenario: Sample data is hidden when disabled
- **WHEN** the `sample_data` feature flag is disabled
- **THEN** client apps do not render controls to load or remove sample data

#### Scenario: Account deletion is hidden when disabled
- **WHEN** the `account_deletion` feature flag is disabled
- **THEN** client apps do not render the Delete account section
- **AND** the API rejects account deletion requests with `403` and the JSON error envelope
