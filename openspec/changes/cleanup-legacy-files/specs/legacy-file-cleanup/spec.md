## ADDED Requirements

### Requirement: File Identification
The system SHALL identify unused legacy files that are safe to remove from the repository.

#### Scenario: Identify car.html as unused
- **WHEN** checking for references to car.html
- **THEN** no active pages reference the file

#### Scenario: Identify anthias directory as unused
- **WHEN** checking for references to anthias/
- **THEN** no active pages reference the directory or its contents

### Requirement: File Removal
The system SHALL remove identified legacy files from the repository.

#### Scenario: Remove car.html
- **WHEN** executing cleanup operation
- **THEN** car.html is deleted from repository root

#### Scenario: Remove anthias directory
- **WHEN** executing cleanup operation
- **THEN** anthias/ directory and all contents are deleted

### Requirement: Documentation Update
The system SHALL update project documentation to reflect current file structure.

#### Scenario: Update AGENTS.md references
- **WHEN** documentation references legacy files
- **THEN** AGENTS.md is updated to remove mentions of car.html and anthias/

### Requirement: Reference Verification
The system SHALL verify no active dependencies reference removed files.

#### Scenario: Verify no broken references
- **WHEN** checking HTML files for references
- **THEN** no files contain links or references to car.html or anthias/

### Requirement: Site Functionality
The system SHALL ensure portfolio site remains functional after cleanup.

#### Scenario: Site works after cleanup
- **WHEN** accessing index.html and gallery.html after removal
- **THEN** pages load correctly with all styling and interactivity intact

### Requirement: Git Operations
The system SHALL create descriptive commit for cleanup changes.

#### Scenario: Create cleanup commit
- **WHEN** changes are staged
- **THEN** commit message describes removed files and documentation updates