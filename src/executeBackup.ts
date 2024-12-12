import { BitwardenExtractor } from './bitwardenExtractor';
import { KeePassWriter } from './keepassWriter';

const DEFAULTS = {
  ATTACHMENT_TEMP_FOLDER: './attachmentBackup',
  MAX_ATTACHMENT_BYTES: 1e5,
  KEEPASS_BACKUP_PATH: './backup',
  KEEPASS_BACKUP_FILE_NAME: 'BitwardenBackup_%date%',
  ORGANIZATIONS_GROUP_NAME: 'Organizations',
};

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

  const backupPassword = process.env['KEEPASS_BACKUP_PASSWORD']
    ? atob(process.env['KEEPASS_BACKUP_PASSWORD'])
    : process.env['BW_PASSWORD']!;

  const attachmentTempFolder =
    process.env['ATTACHMENT_TEMP_FOLDER'] || DEFAULTS.ATTACHMENT_TEMP_FOLDER;
  const maxAttachmentBytes = process.env['MAX_ATTACHMENT_BYTES']
    ? Number.parseInt(process.env['MAX_ATTACHMENT_BYTES'])
    : DEFAULTS.MAX_ATTACHMENT_BYTES;

  const backupPath = process.env['KEEPASS_BACKUP_PATH'] || DEFAULTS.KEEPASS_BACKUP_PATH;
  const backupFileName =
    process.env['KEEPASS_BACKUP_FILE_NAME'] || DEFAULTS.KEEPASS_BACKUP_FILE_NAME;
  const backupDatabaseName = process.env['KEEPASS_BACKUP_DATABASE_NAME'] || backupFileName;

  const organizationsFolderName =
    process.env['ORGANIZATIONS_GROUP_NAME'] || DEFAULTS.ORGANIZATIONS_GROUP_NAME;

  // ================ DO BACKUP ================
  const backupDate = new Date().toISOString().slice(0, -5).replaceAll(':', '-');
  const keepassFileName = backupFileName.replaceAll('%date%', backupDate);
  const keepassDatabaseName = backupDatabaseName.replaceAll('%date%', backupDate);

  const bitwardenExtractor = new BitwardenExtractor(url, attachmentTempFolder, maxAttachmentBytes);
  const bitwardenData = await bitwardenExtractor.getBitwardenData();

  const keepassWriter = new KeePassWriter(
    keepassDatabaseName,
    backupPassword,
    organizationsFolderName,
  );
  await keepassWriter.fillDatabaseWithBitwardenData(bitwardenData);
  await keepassWriter.writeDatabase(backupPath, keepassFileName);

  bitwardenExtractor.logout();
}
