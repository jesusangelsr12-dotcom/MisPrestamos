"use client";

import { useState } from "react";
import { Plus, Pencil, X } from "lucide-react";

interface TagOption {
  id: string;
  name: string;
}

interface TagPickerProps {
  label: string;
  options: TagOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  onCreate: (name: string) => Promise<TagOption>;
  onDelete?: (id: string) => Promise<void>; // habilita el modo "editar" para borrar chips
  noneLabel?: string; // si se define, se muestra como chip seleccionable con value=null
}

const chipCls = (active: boolean) =>
  `flex h-9 shrink-0 items-center justify-center rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap ${
    active ? "bg-[#2C6CFF] text-white" : "border border-[#EBEBEB] bg-white text-[#6B6B6B]"
  }`;

export function TagPicker({ label, options, value, onChange, onCreate, onDelete, noneLabel }: TagPickerProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!onDelete) return;
    setDeletingId(id);
    try {
      await onDelete(id);
      if (value === id) onChange(null);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const created = await onCreate(name);
      onChange(created.id);
      setCreating(false);
      setNewName("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="block text-[13px] font-medium text-[#1A1A1A]">{label}</span>
        {onDelete && options.length > 0 && (
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className="flex items-center gap-1 text-[12px] font-medium text-[#2C6CFF]"
          >
            <Pencil size={12} /> {editMode ? "Listo" : "Editar"}
          </button>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {noneLabel && (
          <button type="button" onClick={() => onChange(null)} className={chipCls(value === null)}>
            {noneLabel}
          </button>
        )}
        {options.map((option) =>
          editMode ? (
            <button
              key={option.id}
              type="button"
              onClick={() => handleDelete(option.id)}
              disabled={deletingId === option.id}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#F5C2C2] bg-[#FEF2F2] px-3.5 text-[13px] font-medium text-[#EF4444] disabled:opacity-50"
            >
              {option.name} <X size={13} />
            </button>
          ) : (
            <button key={option.id} type="button" onClick={() => onChange(option.id)} className={chipCls(value === option.id)}>
              {option.name}
            </button>
          )
        )}
        {!creating && !editMode && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-dashed border-[#C8C8C4] px-3.5 text-[13px] font-medium text-[#6B6B6B]"
          >
            <Plus size={14} /> Nueva
          </button>
        )}
      </div>

      {creating && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre"
            className="h-10 flex-1 rounded-[10px] border border-[#EBEBEB] bg-white px-3 text-[14px] text-[#1A1A1A] focus:border-[#2C6CFF] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving || !newName.trim()}
            className="flex h-10 items-center justify-center rounded-[10px] bg-[#2C6CFF] px-4 text-[13px] font-medium text-white disabled:opacity-50"
          >
            Agregar
          </button>
          <button
            type="button"
            onClick={() => { setCreating(false); setNewName(""); }}
            className="flex h-10 items-center justify-center rounded-[10px] px-3 text-[13px] text-[#A8A8A8]"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
