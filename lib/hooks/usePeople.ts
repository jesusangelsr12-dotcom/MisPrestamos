"use client";

import { useState, useEffect, useCallback } from "react";
import type { Person } from "@/types";
import { fetchPeople, insertPerson, deletePersonById } from "@/lib/db/people";

interface UsePeopleReturn {
  people: Person[];
  loading: boolean;
  createPerson: (name: string) => Promise<Person>;
  deletePerson: (id: string) => Promise<void>;
}

export function usePeople(): UsePeopleReturn {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPeople()
      .then(setPeople)
      .catch((err) => console.error("[usePeople] Error:", err))
      .finally(() => setLoading(false));
  }, []);

  const createPerson = useCallback(async (name: string): Promise<Person> => {
    const created = await insertPerson(name);
    setPeople((prev) =>
      prev.some((p) => p.id === created.id) ? prev : [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
    );
    return created;
  }, []);

  const deletePerson = useCallback(async (id: string): Promise<void> => {
    const previous = people;
    setPeople((prev) => prev.filter((p) => p.id !== id));
    try {
      await deletePersonById(id);
    } catch (err) {
      setPeople(previous);
      throw err;
    }
  }, [people]);

  return { people, loading, createPerson, deletePerson };
}
