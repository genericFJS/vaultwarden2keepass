import type {
  Card,
  CardItem,
  Identity,
  IdentityItem,
  Item,
  Login,
  LoginItem,
  SecureNote,
  SecureNoteItem,
} from './bitwardenCliTypes';
import { protect, type MappingRecord } from './fieldMappingsUtil';
import { ProtectedValue } from './kdbxweb';

/**
 * Mappings from bitwarden attributes to KeePass fields names and values:
 * - `undefined`: Attribute is not saved to a KeePass field
 * - `field` only: Attribute is saved to the KeePass field of the given name without conversion
 * - `field`+`transformation`: Attribute is transformed according to the function and than saved to the KeePass field of the given name
 * - `mapping`: If attribute is a array, the mapping function can map each list-item to a separate KeePass field.
 *
 * Inspiration for field/value mappings:
 * - https://github.com/querylab/lazywarden/blob/85afd87a3b26c5ae82067f843bc0cd4dda0a4805/app/import_to_keepass.py#L258
 * - https://github.com/k3karthic/bitwarden-to-keepass/blob/bcfd01ffd001ad59431b75c81bddbb5848368edc/bitwarden_to_keepass/convert.py#L91
 */
export const fieldMappings = {
  item: {
    id: undefined,
    name: { field: 'Title' },
    passwordHistory: undefined,
    revisionDate: undefined,
    creationDate: undefined,
    deletedDate: undefined,
    organizationId: undefined,
    folderId: undefined,
    type: undefined,
    reprompt: undefined,
    notes: {
      field: 'Notes',
      transformation: (value, item) => {
        if (!value) return undefined;
        return 'secureNote' in item ? ProtectedValue.fromString(value) : value;
      },
    },
    favorite: undefined,
    collectionIds: undefined,
    attachments: undefined,
    fields: undefined,
    card: undefined,
    identity: undefined,
    login: undefined,
    secureNote: undefined,
  } satisfies MappingRecord<Item> as MappingRecord<Item>,

  card: {
    cardholderName: { field: 'Holder' },
    brand: { field: 'Brand' },
    number: { field: 'Number' },
    expMonth: { field: 'ExpiresMonth' },
    expYear: { field: 'ExpiresYear' },
    code: { field: 'CVV' },
  } satisfies MappingRecord<Card, CardItem> as MappingRecord<Card, CardItem>,

  identity: {
    title: { field: 'NameTitle' },
    firstName: { field: 'FirstName' },
    middleName: { field: 'MiddleName' },
    lastName: { field: 'LastName' },
    address1: { field: 'Address1' },
    address2: { field: 'Address2' },
    address3: { field: 'Address3' },
    city: { field: 'City' },
    state: { field: 'State' },
    postalCode: { field: 'PostalCode' },
    country: { field: 'Country' },
    company: { field: 'Company' },
    email: { field: 'Email' },
    phone: { field: 'Phone' },
    ssn: { field: 'SSN' },
    username: { field: 'UserName' },
    passportNumber: { field: 'PassportNumber' },
    licenseNumber: { field: 'LicenseNumber' },
  } satisfies MappingRecord<Identity, IdentityItem> as MappingRecord<Identity, IdentityItem>,

  login: {
    fido2Credentials: undefined,
    uris: {
      mapping: (values) => {
        return values.map((uri, index) => ({
          subValue: uri,
          mapping: {
            field: index === 0 ? 'URL' : `URL_${index}`,
            transformation: (value) => value.uri,
          },
        }));
      },
    },
    username: { field: 'UserName' },
    password: { field: 'Password', transformation: protect },
    totp: {
      field: 'otp',
      transformation: (value, item) =>
        `otpauth://totp/${encodeURIComponent(item.login.username ?? 'unknown')}?secret=${value}&issuer=${encodeURIComponent(item.name)}`,
    },
    passwordRevisionDate: undefined,
  } satisfies MappingRecord<Login, LoginItem> as MappingRecord<Login, LoginItem>,

  secureNote: {
    type: undefined,
  } satisfies MappingRecord<SecureNote, SecureNoteItem> as MappingRecord<
    SecureNote,
    SecureNoteItem
  >,
};
