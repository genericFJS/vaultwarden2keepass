import type { BitwardenData } from './bitwardenExtractor';
import type { Collection, Folder, Item } from './bitwardenCliTypes';
import { fieldMappings } from './fieldMappings';
import {
  getMapping,
  type FieldMapping,
  type ItemData,
  type ItemType,
  type MappingRecord,
} from './fieldMappingsUtil';
import { Credentials, Kdbx, ProtectedValue, type KdbxGroup } from './kdbxweb';
import { mkdirSync, writeFileSync } from 'fs';
import type { KdbxEntry } from 'kdbxweb';
import { join, resolve } from 'path';

export class KeePassWriter {
  private db: Kdbx;

  constructor(
    name: string,
    password: string,
    private organizationsFolderName: string,
  ) {
    const credentials = new Credentials(ProtectedValue.fromString(password));

    this.db = Kdbx.create(credentials, name);
    this.db.createDefaultGroup();
  }

  /**
   * Fills KeePass database with data from bitwarden.
   *
   * @param bitwarden All the data from bitwarden.
   */
  async fillDatabaseWithBitwardenData(bitwarden: BitwardenData) {
    console.log('💻 Filling KeePass database with bitwarden data');
    // Transform organizations folder name so there are no collisions with existing folders
    const allRootFolders = new Set([
      ...bitwarden.folders.map((f) => KeePassWriter.getSubfolders(bitwarden.folders, f.name)[0]),
      ...bitwarden.collections.map(
        (c) => KeePassWriter.getSubfolders(bitwarden.collections, c.name)[0],
      ),
    ]);
    const originalOrganizationsFolder = this.organizationsFolderName;
    if (allRootFolders.has(this.organizationsFolderName)) {
      this.organizationsFolderName = `Bitwarden${originalOrganizationsFolder}`;
    }
    for (let i = 0; allRootFolders.has(this.organizationsFolderName); i++) {
      this.organizationsFolderName = `${originalOrganizationsFolder}_${i}`;
    }

    console.log('⏱️ Adding folders and collections as groups');
    // add folders
    let groups = this.addGroups(this.db.getDefaultGroup(), bitwarden.folders);

    // add organizations/collections
    if (bitwarden.organizations.length > 0) {
      const organizationsGroup = this.db.createGroup(
        this.db.getDefaultGroup(),
        this.organizationsFolderName,
      );
      for (const organization of bitwarden.organizations) {
        const organizationGroup = this.db.createGroup(organizationsGroup, organization.name);
        const collections = bitwarden.collections.filter(
          (c) => c.organizationId === organization.id,
        );
        if (collections.length > 0) {
          groups = { ...groups, ...this.addGroups(organizationGroup, collections) };
        }
      }
    }

    console.log('⏱️ Adding items as entries');
    const noFolder = bitwarden.folders.find((f) => !f.id);
    // add items
    for (const item of bitwarden.items) {
      // get all group and all collections of item
      const groupsOfItem =
        /* implicitly no folder/collection */ (!item.folderId && item.collectionIds.length === 0) ||
        /* explicitly no folder */ item.folderId === noFolder?.id
          ? [this.db.getDefaultGroup()]
          : [item.folderId, ...item.collectionIds]
              .filter((v) => v !== undefined)
              .map((id) => groups[id]);

      // Add entry to each group
      for (const group of groupsOfItem) {
        const entry = this.db.createEntry(group);

        // basic item information
        this.addFields(entry, item, item, fieldMappings.item);

        // attachments
        for (const { id, fileName, sizeName } of item.attachments ?? []) {
          if (id in bitwarden.attachments) {
            const attachment = await this.db.createBinary(bitwarden.attachments[id]);
            entry.binaries.set(fileName, attachment);
          } else {
            console.log(
              `\t🔵 Skipping file '${fileName}' for item '${bitwarden.folders.find((f) => f.id === item.folderId)?.name ?? '-'}/${item.name}' (too big: ${sizeName})`,
            );
          }
        }

        // custom fields
        for (const field of item.fields ?? []) {
          entry.fields.set(
            field.name,
            field.linkedId ? `Linked to ${field.linkedId}` : field.value,
          );
        }

        // entry-specific information
        if ('card' in item) {
          entry.icon = 66;
          entry.tags.push('Card');
          if (item.card.brand) entry.tags.push(item.card.brand);

          this.addFields(entry, item.card, item, fieldMappings.card);
        }

        if ('identity' in item) {
          entry.icon = 9;
          entry.tags.push('Identity');

          this.addFields(entry, item.identity, item, fieldMappings.identity);
        }

        if ('login' in item) {
          entry.tags.push('Login');

          this.addFields(entry, item.login, item, fieldMappings.login);
        }

        if ('secureNote' in item) {
          entry.icon = 7;
          entry.tags.push('SecureNote');

          this.addFields(entry, item.secureNote, item, fieldMappings.secureNote);
        }
      }
    }

    console.log('✅ Bitwarden data added to KeePass database');
  }

  /**
   * Saves database to disk.
   *
   * @param path Path to save database to.
   * @param filename Filename of database.
   */
  async writeDatabase(path: string, filename: string) {
    console.log('💻 Saving KeePass database disk');
    mkdirSync(path, { recursive: true });
    filename = filename.endsWith('.kdbx') ? filename : `${filename}.kdbx`;
    const fullPath = join(path, filename);
    writeFileSync(fullPath, Buffer.from(await this.db.save()));
    console.log('✅ Keepass database saved to', resolve(fullPath));
  }

  /**
   * Adds fields to entry based on a bitwarden object and mapping.
   *
   * @param entry Entry to add fields to.
   * @param bitwardenObject Bitwarden object containing data.
   * @param item Bitwarden item (for mapping context).
   * @param mapping Mapping information for fields.
   */
  private addFields<T extends ItemData, I extends ItemType>(
    entry: KdbxEntry,
    bitwardenObject: T,
    item: Item,
    mapping: MappingRecord<T, I>,
  ) {
    for (const [key, value] of Object.entries(bitwardenObject)) {
      this.addField(entry, value, item, getMapping(mapping, key));
    }
  }

  /**
   * Bitwarden does not differentiate between "/" in a folder name and the "/" between folders.
   * Here we try to find which is which.
   *
   * @param folders All folders from bitwarden.
   * @param folderOrPath Folder name to find subfolders of.
   * @returns Subfolders for folder name.
   */
  static getSubfolders(folders: (Folder | Collection)[], folderOrPath: string) {
    const subfolders: string[] = [];

    const allFolders = new Set(folders.map((f) => f.name));
    const potentialSubfolders = folderOrPath.split('/');

    const path: string[] = [];
    let subfolderParts: string[] = [];
    for (const potentialSubfolder of potentialSubfolders) {
      path.push(potentialSubfolder);
      subfolderParts.push(potentialSubfolder);

      if (allFolders.has(path.join('/'))) {
        subfolders.push(subfolderParts.join('/'));
        subfolderParts = [];
      }
    }

    return subfolders;
  }

  /**
   * Adds folders/groups to KeePass database.
   *
   * @param root Root KeePass-group to add (sub-)groups to.
   * @param folders Bitwarden folders to add as groups.
   * @returns Record of bitwarden folder ids with corresponding KeePass groups.
   */
  private addGroups(root: KdbxGroup, folders?: (Folder | Collection)[]): Record<string, KdbxGroup> {
    if (!folders) return {};
    return folders.reduce(
      (partial, { id, name }) => {
        if (id == null) return partial;
        const subfolders = KeePassWriter.getSubfolders(folders, name);

        let parent = root;
        for (const folder of subfolders) {
          const availableParent = [...parent.allGroups()].find((g) => g.name === folder);
          if (!availableParent) {
            parent = this.db.createGroup(parent, folder);
          } else {
            parent = availableParent;
          }
        }
        partial[id] = parent;
        return partial;
      },
      {} as Record<string, KdbxGroup>,
    );
  }

  /**
   * Adds a field to the KeePass database based on the Bitwarden field value and its mapping.
   *
   * @param entry Entry to add fields to.
   * @param value Value of the bitwarden field.
   * @param item Bitwarden item (for mapping context).
   * @param fieldMapping Mapping information for field.
   * @returns True, if a field (or at least one field of an array) was added.
   */
  private addField<T extends unknown | unknown[]>(
    entry: KdbxEntry,
    value: T,
    item: Item,
    fieldMapping?: FieldMapping,
  ): boolean {
    if (!fieldMapping) return false;

    if (!('field' in fieldMapping)) {
      let addedAtLeastOneField = false;
      for (const { mapping, subValue } of fieldMapping.mapping(value as unknown[])) {
        addedAtLeastOneField ||= this.addField(entry, subValue, item, mapping);
      }
      return addedAtLeastOneField;
    }

    const fieldName = fieldMapping.field;
    const fieldValue = value
      ? fieldMapping.transformation
        ? fieldMapping.transformation(value, item)
        : `${value}`
      : undefined;
    if (!fieldValue) return false;
    entry.fields.set(fieldName, fieldValue);
    return true;
  }
}
