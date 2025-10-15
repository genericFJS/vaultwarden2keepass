import { readFileSync } from 'fs';
import { BitwardenExtractor } from './bitwardenExtractor';
import { KeePassWriter } from './keepassWriter';

const DEFAULTS = {
  ATTACHMENT_TEMP_FOLDER: './attachmentBackup',
  MAX_ATTACHMENT_BYTES: 1e5,
  KEEPASS_BACKUP_PATH: './backup',
  KEEPASS_BACKUP_FILE_NAME: 'BitwardenBackup_%date%',
  ORGANIZATIONS_GROUP_NAME: 'Organizations',
  ORGANIZATION_FOLDERS_NAME: 'Folders',
  ORGANIZATION_COLLECTIONS_NAME: 'Collections',
} as const;

function ensureParameter(parameter: string, explanation: string) {
  const value = process.env[parameter];
  if (!value) throw `Missing environment variable '${parameter}': ${explanation}`;
  return value;
}

export async function executeBackup() {
  // ================ GET PARAMETERS ================
  const url = ensureParameter('URL', 'Need url of Bitwarden/Vaultwarden instance');
  ensureParameter(
    'BW_CLIENTID',
    'Need API client id; see https://bitwarden.com/help/personal-api-key/',
  );
  ensureParameter(
    'BW_CLIENTSECRET',
    'Need API client secret; see https://bitwarden.com/help/personal-api-key/',
  );
  ensureParameter('BW_PASSWORD', 'Need password to unlock vault');
  process.env['BW_PASSWORD'] = atob(process.env['BW_PASSWORD']!);

  let backupKeyFile: Buffer | undefined;

  try {
    const keyFilePath = process.env['KEEPASS_BACKUP_KEYFILE_PATH'];
    backupKeyFile = keyFilePath ? readFileSync(keyFilePath) : undefined;
  } catch (err) {
    console.error(`⚠️  Skipped reading KEEPASS_BACKUP_KEYFILE_PATH -`, (err as Error).toString());
  }

  let backupPassword = atob(process.env['KEEPASS_BACKUP_PASSWORD'] || '');

  // Fallback to decoded BW_PASSWORD if no key file or backup password.
  if (!backupKeyFile && !backupPassword) {
    console.log('🛈  Will use BW_PASSWORD as KeePass backup password');
    backupPassword = process.env['BW_PASSWORD'];
  }

  const attachmentTempFolder =
    process.env['ATTACHMENT_TEMP_FOLDER'] || DEFAULTS.ATTACHMENT_TEMP_FOLDER;
  const maxAttachmentBytes = process.env['MAX_ATTACHMENT_BYTES']
    ? Number.parseInt(process.env['MAX_ATTACHMENT_BYTES'])
    : DEFAULTS.MAX_ATTACHMENT_BYTES;

  const backupPath = process.env['KEEPASS_BACKUP_PATH'] || DEFAULTS.KEEPASS_BACKUP_PATH;
  const backupFileName =
    process.env['KEEPASS_BACKUP_FILE_NAME'] || DEFAULTS.KEEPASS_BACKUP_FILE_NAME;
  const backupDatabaseName = process.env['KEEPASS_BACKUP_DATABASE_NAME'] || backupFileName;

  const organizationsRootName =
    process.env['ORGANIZATIONS_GROUP_NAME'] || DEFAULTS.ORGANIZATIONS_GROUP_NAME;

  const organizationsFoldersName =
    process.env['ORGANIZATION_FOLDERS_NAME'] || DEFAULTS.ORGANIZATION_FOLDERS_NAME;
  const organizationsCollectionsName =
    process.env['ORGANIZATION_COLLECTIONS_NAME'] || DEFAULTS.ORGANIZATION_COLLECTIONS_NAME;

  // ================ DO BACKUP ================
  const backupDate = new Date().toISOString().slice(0, -5).replaceAll(':', '-');
  const keepassFileName = backupFileName.replaceAll('%date%', backupDate);
  const keepassDatabaseName = backupDatabaseName.replaceAll('%date%', backupDate);

  const bitwardenExtractor = new BitwardenExtractor(url, attachmentTempFolder, maxAttachmentBytes);
  const bitwardenData = await bitwardenExtractor.getBitwardenData();
  bitwardenExtractor.logout();

  const keepassWriter = new KeePassWriter({
    name: keepassDatabaseName,
    keyFile: backupKeyFile,
    password: backupPassword,
    organizationFolderNames: {
      organizations: organizationsRootName,
      collections: organizationsCollectionsName,
      folders: organizationsFoldersName,
    },
  });
  await keepassWriter.fillDatabaseWithBitwardenData(bitwardenData);
  await keepassWriter.writeDatabase(backupPath, keepassFileName);
}
