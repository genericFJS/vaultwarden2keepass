import type { Folder } from '../src/bitwardenCliTypes';
import { KeePassWriter } from '../src/keepassWriter';
import { describe, it, expect } from 'vitest';

describe('should transform bitwarden folder names to subfolders', () => {
  it('gets folders where first folder contains slash', () => {
    const folders: Folder[] = [
      {
        object: 'folder',
        name: 'a/b',
      },
      {
        object: 'folder',
        name: 'a/b/c',
      },
      {
        object: 'folder',
        name: 'a/b/c/d',
      },
    ];

    expect(KeePassWriter.getSubfolders(folders, folders.at(-1)!.name)).toEqual(['a/b', 'c', 'd']);
  });

  it('gets folders where middle folder contains slash', () => {
    const folders: Folder[] = [
      {
        object: 'folder',
        name: 'a',
      },
      {
        object: 'folder',
        name: 'a/b/c',
      },
      {
        object: 'folder',
        name: 'a/b/c/d',
      },
    ];

    expect(KeePassWriter.getSubfolders(folders, folders.at(-1)!.name)).toEqual(['a', 'b/c', 'd']);
  });

  it('gets folders where last folder contains slash', () => {
    const folders: Folder[] = [
      {
        object: 'folder',
        name: 'a',
      },
      {
        object: 'folder',
        name: 'a/b',
      },
      {
        object: 'folder',
        name: 'a/b/c/d',
      },
    ];

    expect(KeePassWriter.getSubfolders(folders, folders.at(-1)!.name)).toEqual(['a', 'b', 'c/d']);
  });

  it('gets folders where first and last folder contains slash', () => {
    const folders: Folder[] = [
      {
        object: 'folder',
        name: 'a/b',
      },
      {
        object: 'folder',
        name: 'a/b/c/d',
      },
    ];

    expect(KeePassWriter.getSubfolders(folders, folders.at(-1)!.name)).toEqual(['a/b', 'c/d']);
  });

  it('gets folders where entire folder contains slash', () => {
    const folders: Folder[] = [
      {
        object: 'folder',
        name: 'a/b/c/d',
      },
    ];

    expect(KeePassWriter.getSubfolders(folders, folders.at(-1)!.name)).toEqual(['a/b/c/d']);
  });
});
