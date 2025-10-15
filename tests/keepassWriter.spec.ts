import { describe, expect, it } from 'vitest';
import { KeePassWriter } from '../src/keepassWriter';

describe('should transform bitwarden folder names to subfolders', () => {
  it('gets folders where first folder contains slash', () => {
    const folders: string[] = ['a/b', 'a/b/c', 'a/b/c/d'];

    expect(KeePassWriter.getSubfolders(folders, folders.at(-1)!)).toEqual(['a/b', 'c', 'd']);
  });

  it('gets folders where middle folder contains slash', () => {
    const folders: string[] = ['a', 'a/b/c', 'a/b/c/d'];

    expect(KeePassWriter.getSubfolders(folders, folders.at(-1)!)).toEqual(['a', 'b/c', 'd']);
  });

  it('gets folders where last folder contains slash', () => {
    const folders: string[] = ['a', 'a/b', 'a/b/c/d'];

    expect(KeePassWriter.getSubfolders(folders, folders.at(-1)!)).toEqual(['a', 'b', 'c/d']);
  });

  it('gets folders where first and last folder contains slash', () => {
    const folders: string[] = ['a/b', 'a/b/c/d'];

    expect(KeePassWriter.getSubfolders(folders, folders.at(-1)!)).toEqual(['a/b', 'c/d']);
  });

  it('gets folders where entire folder contains slash', () => {
    const folders: string[] = ['a/b/c/d'];

    expect(KeePassWriter.getSubfolders(folders, folders.at(-1)!)).toEqual(['a/b/c/d']);
  });
});
