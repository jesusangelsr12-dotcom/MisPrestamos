"use client";

import { useState, useEffect, useCallback } from "react";
import type { Person } from "@/types";
import { fetchPeople, insertPerson } from "@/lib/db/people";

interface UsePeopleReturn {
  people: Person[];
  loading: boolean;
  createPerson: (name: string) => Promise<Person>;
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

  return { people, loading, createPerson };
}
