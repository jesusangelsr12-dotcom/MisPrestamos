"use server";

import { sql, buildUpdate } from "@/lib/db/client";
import type { Card } from "@/types";

export type CardInput = Omit<Card, "id" | "created_at">;

export async function fetchCards(): Promise<Card[]> {
  const rows = await sql.query(`select * from cards order by created_at desc`);
  return rows as Card[];
}

export async function fetchCardById(id: string): Promise<Card | null> {
  const rows = await sql.query(`select * from cards where id = $1 limit 1`, [id]);
  return (rows[0] as Card) ?? null;
}

export async function insertCard(card: CardInput): Promise<Card> {
  const rows = await sql.query(
    `insert into cards (name, bank, color, last_four)
     values ($1, $2, $3, $4)
     returning *`,
    [card.name, card.bank, card.color, card.last_four]
  );
  return rows[0] as Card;
}

export async function updateCardById(
  id: string,
  card: Partial<CardInput>
): Promise<Card> {
  const { text, values } = buildUpdate("cards", id, { ...card });
  const rows = await sql.query(text, values);

  if (!rows[0]) throw new Error("Tarjeta no encontrada");
  return rows[0] as Card;
}

export async function deleteCardById(id: string): Promise<void> {
  const [{ count }] = (await sql.query(
    `select count(*)::int as count from msi_expenses where card_id = $1`,
    [id]
  )) as { count: number }[];

  if (count > 0) {
    throw new Error(
      "No se puede eliminar: esta tarjeta tiene gastos MSI asociados"
    );
  }

  await sql.query(`delete from cards where id = $1`, [id]);
}
