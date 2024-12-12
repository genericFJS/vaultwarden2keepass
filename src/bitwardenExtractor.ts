import type { Attachment, Collection, Folder, Item, Organization } from './bitwardenCliTypes';
import { execSync } from 'child_process';
import { mkdirSync, readFileSync, rmSync } from 'fs';
import { join, resolve } from 'path';

type Status = 'unauthenticated' | 'locked';

export interface BitwardenData {
  organizations: Organization[];
  collections: Collection[];
  folders: Folder[];
  items: Item[];
  attachments: Record<string, ArrayBuffer>;
}

export class BitwardenExtractor {
  session?: string;

  constructor(
    private url: string,
    private attachmentTempFolder: string,
    private maxAttachmentSize: number,
  ) {
    // bitwarden cli has som deprecation warnings
    process.env['NODE_NO_WARNINGS'] = '1';
  }

  /**
   * Runs a bitwarden cli command.
   *
   * @param command The bitwarden cli command.
   * @param args Arguments for the command.
   * @param message A message to display before executing the command.
   * @returns Result of the command.
   */
  private runCli(command: string, args?: string, message?: string) {
    if (message) console.log('⏱ ', message);
    return execSync(`bw ${command} ${args ?? ''}`).toString();
  }

  /**
   * Runs a bitwarden cli command and interprets its output as JSON.
   *
   * @param command The bitwarden cli command.
   * @param args Arguments for the command.
   * @param message A message to display before executing the command.
   * @returns Result of the command as JSON.
   */
  private getCliJson<T>(command: string, args?: string, message?: string) {
    return JSON.parse(this.runCli(command, args, message)) as T;
  }

  /**
   * Get status of the bitwarden cli.
   *
   * @returns Bitwarden cli status string.
   */
  private getStatus(): Status {
    return this.getCliJson<{ status: Status }>('status').status;
  }

  /**
   * Authenticates bitwarden cli with api key and unlocks it with password.
   */
  private login() {
    let status = this.getStatus();

    if (status === 'unauthenticated') {
      this.runCli('config server', this.url, 'Setting server url');
      status = this.getStatus();
      console.log('✅ Set server to url:', this.url);

      this.runCli('login', '--apikey', 'Logging in with api key');
      status = this.getStatus();
      console.log('✅ Logged in with api key');
    }

    if (status === 'locked') {
      const session = this.runCli(
        'unlock',
        '--passwordenv BW_PASSWORD --raw',
        'Unlocking with password',
      );
      console.log('✅ Unlocked with password and got session:', session);
      process.env['BW_SESSION'] = session;
      this.session = session;
    }
  }

  /**
   * Downloads attachments of items and saves them in code for later usage.
   * DISCLAIMER: The bitwarden cli downloads files to disk (--raw output could circumvent this but may break binary files [untested]). Directly after download the files are read, saved to a variable and deleted from disk. But for a short time they exist unencrypted outside of this script.
   *
   * @param items Bitwarden items.
   * @returns Record of attachment ids with corresponding attachments.
   */
  private downloadAttachments(items: Item[]) {
    const allAttachments = items.reduce(
      (partial, item) => {
        if (item.attachments)
          partial.push(...item.attachments.map((attachment) => ({ attachment, itemId: item.id })));
        return partial;
      },
      [] as { itemId: string; attachment: Attachment }[],
    );
    const downloadableAttachments = allAttachments.filter(
      (x) => Number.parseInt(x.attachment.size) <= this.maxAttachmentSize,
    );

    console.log(
      `💻 Fetching ${downloadableAttachments.length} attachments smaller then ${this.maxAttachmentSize} bytes (skipping ${allAttachments.length - downloadableAttachments.length} larger attachments) to temporary directory ${resolve(this.attachmentTempFolder)}`,
    );
    const attachments: Record<string, ArrayBuffer> = {};
    for (const { attachment, itemId } of downloadableAttachments) {
      const path = join(this.attachmentTempFolder, attachment.id);
      mkdirSync(path, { recursive: true });
      const attachmentPath = join(path, attachment.fileName);
      try {
        this.runCli(
          'get',
          `attachment ${attachment.fileName} --itemid ${itemId} --output ${path}/`,
          `Downloading attachment ${attachment.id}`,
        );
        attachments[attachment.id] = readFileSync(attachmentPath) as unknown as ArrayBuffer;
      } finally {
        rmSync(attachmentPath);
      }
    }
    return attachments;
  }

  /**
   * Get Bitwarden data via the bitwarden cli.
   * Since `bw export` does not export everything, the `bw list` commands are used.
   *
   * @returns Bitwarden data containing items, folders, collections, organizations and attachments.
   */
  async getBitwardenData(): Promise<BitwardenData> {
    console.log('💻 Using bitwarden CLI to export vault and organizations');

    this.login();

    const organizations = this.getCliJson<Organization[]>(
      'list',
      'organizations',
      'Retrieving organizations',
    );
    console.log('✅ Got', organizations.length, 'organizations');

    const collections = this.getCliJson<Collection[]>(
      'list',
      'collections',
      'Retrieving collections',
    );
    console.log('✅ Got', collections.length, 'collections');

    const folders = this.getCliJson<Folder[]>('list', 'folders', 'Retrieving folders');
    console.log('✅ Got', folders.length, 'folders');

    const items = this.getCliJson<Item[]>('list', 'items', 'Retrieving items');
    console.log('✅ Got', items.length, 'items');

    const attachments = this.downloadAttachments(items);
    console.log('✅ Got', Object.keys(attachments).length, 'attachments');

    return {
      organizations,
      collections,
      folders,
      items,
      attachments,
    };
  }

  /**
   * Logout of the bitwarden cli.
   */
  logout() {
    this.runCli('logout', undefined, 'Logging out');
    console.log('✅ Logged out');
  }
}
