# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.2.0

### Changed

- Organization items are saved differently in the keepass file.
  - Organizations no longer have each collection as direct keepass group children (and no folders; see fix below).
  - Organizations now have a keepass group for folders and collections; in these groups the folders and collections are created as keepass groups.
  - This resembles the structure how it is presented in vaultwarden.

### Fixed

- Organization items appearing in the folders outside of the organization.

## 1.1.0

### Added

- Support for keepass key files (thanks to [rahul-kurup](https://github.com/rahul-kurup)).

## 1.0.0

### Added

- Initial implementation.

### Fixed

- Issue where an already valid otpauth://totp/ URI would be incorrectly re-encoded, leading to a corrupted TOTP value (thanks to [DmitriiPetukhov](https://github.com/DmitriiPetukhov)).
