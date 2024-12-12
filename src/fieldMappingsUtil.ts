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
import { ProtectedValue, type KdbxEntryField } from './kdbxweb';

export type SimpleFieldMapping<K, T> = {
  field: string;
  transformation?: (value: NonNullable<K>, item: T) => KdbxEntryField | undefined;
};

export type ArrayFieldMapping<A extends unknown[], T> = {
  mapping: (values: A) => { subValue: A[number]; mapping: SimpleFieldMapping<A[number], T> }[];
};

export type ItemData = Item | Card | Identity | Login | SecureNote;
export type ItemType = Item | CardItem | IdentityItem | LoginItem | SecureNoteItem;

export type FieldMapping =
  | SimpleFieldMapping<unknown, unknown>
  | ArrayFieldMapping<unknown[], unknown>
  | undefined;

export type MappingRecord<T extends ItemData, I extends ItemType = Item> = {
  [K in keyof T]: T[K] extends Array<unknown>
    ? ArrayFieldMapping<T[K], I> | undefined
    : SimpleFieldMapping<T[K], I> | undefined;
} & Record<keyof T, unknown>;

/**
 * Transformation function for protected strings.
 *
 * @param value Field value.
 * @returns Protected field value.
 */
export const protect = (value: string) => ProtectedValue.fromString(value);

/**
 * Since the mapping-typings are only important for the declarations (and make the usage somewhat more tedious), get the mapping with unknown generic types.
 *
 * @param mappingRecord Record of mappings.
 * @param key Key of the record of mappings.
 * @returns FieldMapping for the key.
 */
export function getMapping<T extends ItemData, I extends ItemType>(
  mappingRecord: MappingRecord<T, I>,
  key: string,
) {
  return mappingRecord[key as keyof T] as FieldMapping;
}
