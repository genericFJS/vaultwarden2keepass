/*
Interfaces extracted from example return values / json exports. There may be missing attributes or attributes that are not marked as optional.
Some attributes that are marked as optional may be `null` (and not `undefined`).
*/

export interface Organization {
  object: string;
  id: string;
  name: string;
  status: number;
  type: number;
  enabled: boolean;
}

export interface Collection {
  object: string;
  id: string;
  name: string;
  organizationId: string;
  externalId?: string;
}

export interface Folder {
  object: string;
  id?: string;
  name: string;
}

interface BasicItem {
  passwordHistory?: PasswordHistory[];
  revisionDate: string;
  creationDate: string;
  deletedDate?: string;
  id: string;
  organizationId?: string;
  folderId?: string;
  type: number;
  reprompt: number;
  name: string;
  notes?: string;
  favorite: boolean;
  collectionIds: string[];
  attachments?: Attachment[];
  fields?: Field[];
}

export interface CardItem extends BasicItem {
  card: Card;
}

export interface IdentityItem extends BasicItem {
  identity: Identity;
}

export interface LoginItem extends BasicItem {
  login: Login;
}

export interface SecureNoteItem extends BasicItem {
  secureNote: SecureNote;
}

export type Item = CardItem | IdentityItem | LoginItem | SecureNoteItem;

export interface PasswordHistory {
  lastUsedDate: string;
  password: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  size: string;
  sizeName: string;
  url: string;
}

export interface Field {
  name: string;
  value: string;
  type: number;
  linkedId?: string;
}

export interface Card {
  cardholderName?: string;
  brand?: string;
  number?: string;
  expMonth?: string;
  expYear?: string;
  code?: string;
}

export interface Identity {
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  company?: string;
  email?: string;
  phone?: string;
  ssn?: string;
  username?: string;
  passportNumber?: string;
  licenseNumber?: string;
}

export interface Login {
  fido2Credentials: unknown[];
  uris: Uri[];
  username?: string;
  password?: string;
  totp?: string;
  passwordRevisionDate?: string;
}

export interface Uri {
  match?: number;
  uri: string;
}

export interface SecureNote {
  type: number;
}
