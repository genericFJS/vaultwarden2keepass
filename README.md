# vaultwarden2keepass

Backup your bitwarden/vaultwarden vault to a KeePass database. In case of catastrophic server failures you can fall back on your keepass file.

This is similar to projects like [lazywarden](https://github.com/querylab/lazywarden) or [bitwarden-to-keepass](https://github.com/k3karthic/bitwarden-to-keepass). Here are some differences:

- ✅ Backup includes organization items
- ✅ Backup includes attachments (size limit configurable)
- ✅ Minimalistic but informative log output
- 🛑 No interfaces to cloud/storage providers. Move created backup yourself wherever you need it (inspiration for your consideration: [Syncthing](https://syncthing.net/) or [rclone](https://rclone.org/))
- 🛑 No scheduler. You may setup cron or similar to trigger the script regularly.
- 🛑 No alternative login methods. Just API-key + Password.

# Usage

## With docker compose

- Download `docker-compose.yml` from this repository
- Edit environment variables
- Run `docker compose up`

## Without docker

- Clone repository `git clone https://github.com/genericFJS/vaultwarden2keepass.git`
- Rename `.env.example` to `.env` and change variables
- Open a console in the cloned repository
- Run `npm install` or `pnpm install` once
- Run `npm run start:env` or `pnpm start:env` whenever you want to create a backup

# Configuration

Use the following environment variables to configure the script:

| variable                                | default                  | mandatory | notes                                                                                              |
| --------------------------------------- | ------------------------ | --------- | -------------------------------------------------------------------------------------------------- |
| `URL`                                   | -                        | x         | use the url to your bitwarden/vaultwarden instance                                                 |
| `BW_CLIENTID`                           | -                        | x         | see [personal api key](https://bitwarden.com/help/personal-api-key/)                               |
| `BW_CLIENTSECRET`                       | -                        | x         | see [personal api key](https://bitwarden.com/help/personal-api-key/)                               |
| `BW_PASSWORD` <sup>\*</sup>             | -                        | x         | password to your bitwarden/vaultwarden account (base64-encoded)                                    |
| `KEEPASS_BACKUP_PASSWORD` <sup>\*</sup> | _[same as BW_PASSWORD]_  |           | password for the KeePass database (base64-encoded)                                                 |
| `ATTACHMENT_TEMP_FOLDER`                | ./attachmentBackup       |           | directory where attachments are temporarily stored (recommendation: use `/tmp` for linux machines) |
| `MAX_ATTACHMENT_BYTES`                  | 100000                   |           | maximum size of an attachment that should be backed up in the KeePass database                     |
| `KEEPASS_BACKUP_PATH`                   | ./backup                 |           | location where KeePass backup should be saved                                                      |
| `KEEPASS_BACKUP_FILE_NAME`              | `BitwardenBackup_%date%` |           | name of the KeePass database file; use `%date%` anywhere to insert path-friendly date+time string  |
| `KEEPASS_BACKUP_DATABASE_NAME`          | _[same as filename]_     |           | name of the KeePass database (when opened); can use `%date%` as well                               |
| `ORGANIZATIONS_GROUP_NAME`              | Organizations            |           | name of the KeePass group where organizations and its items should be stored                       |

\*: In most cases these environment variables are stored in plain text. That means they can easily be read. To make this _somewhat_ more secure and conceal them on first sight, your passwords have to be base64-encoded. To encode your password in base64 use some (online) tool of your choice or just open the developer tools console in any browser (usually via F12) and use the output of `btoa("your_password")`.
