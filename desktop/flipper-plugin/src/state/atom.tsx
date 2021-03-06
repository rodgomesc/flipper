/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {produce} from 'immer';
import {useState, useEffect} from 'react';

export type Atom<T> = {
  get(): T;
  set(newValue: T): void;
  update(recipe: (draft: T) => void): void;
};

class AtomValue<T> implements Atom<T> {
  value: T;
  listeners: ((value: T) => void)[] = [];

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  get() {
    return this.value;
  }

  set(nextValue: T) {
    if (nextValue !== this.value) {
      this.value = nextValue;
      this.notifyChanged();
    }
  }

  update(recipe: (draft: T) => void) {
    this.set(produce(this.value, recipe));
  }

  notifyChanged() {
    // TODO: add scheduling
    this.listeners.slice().forEach((l) => l(this.value));
  }

  subscribe(listener: (value: T) => void) {
    this.listeners.push(listener);
  }

  unsubscribe(listener: (value: T) => void) {
    const idx = this.listeners.indexOf(listener);
    if (idx !== -1) {
      this.listeners.splice(idx, 1);
    }
  }
}

export function createState<T>(initialValue: T): Atom<T> {
  return new AtomValue<T>(initialValue);
}

export function useValue<T>(atom: Atom<T>): T {
  const [localValue, setLocalValue] = useState<T>(atom.get());
  useEffect(() => {
    // atom might have changed between mounting and effect setup
    // in that case, this will cause a re-render, otherwise not
    setLocalValue(atom.get());
    (atom as AtomValue<T>).subscribe(setLocalValue);
    return () => {
      (atom as AtomValue<T>).unsubscribe(setLocalValue);
    };
  }, [atom]);
  return localValue;
}
