"use client";

import useSWR from "swr";
import type { Person } from "@/types";
import { fetchPeople, insertPerson, deletePersonById } from "@/lib/db/people";
import { swrKeys } from "@/lib/swr/finance";

interface UsePeopleReturn {
  people: Person[];
  loading: boolean;
  createPerson: (name: string) => Promise<Person>;
  deletePerson: (id: string) => Promise<void>;
}

export function usePeople(): UsePeopleReturn {
  const { data, isLoading, mutate } = useSWR<Person[]>(swrKeys.people, fetchPeople);
  const people = data ?? [];

  async function createPerson(name: string): Promise<Person> {
    const created = await insertPerson(name);
    await mutate(
      (prev) =>
        prev?.some((p) => p.id === created.id)
          ? prev
          : [...(prev ?? []), created].sort((a, b) => a.name.localeCompare(b.name)),
      { revalidate: false }
    );
    return created;
  }

  async function deletePerson(id: string): Promise<void> {
    const previous = people;
    await mutate(
      people.filter((p) => p.id !== id),
      { revalidate: false }
    );
    try {
      await deletePersonById(id);
    } catch (err) {
      await mutate(previous, { revalidate: false });
      throw err;
    }
  }

  return { people, loading: isLoading, createPerson, deletePerson };
}
