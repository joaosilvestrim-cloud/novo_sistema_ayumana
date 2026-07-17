import { Search } from "lucide-react";
import { Select, Input, Label } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  AUDIENCE_LABELS,
  COUNTRIES,
  type Approach,
  type Audience,
  type Specialty,
} from "@/lib/types";
import type { CatalogFilters } from "@/lib/psychologists";

const AUDIENCES = Object.keys(AUDIENCE_LABELS) as Audience[];

export function CatalogFiltersForm({
  specialties,
  approaches,
  current,
}: {
  specialties: Specialty[];
  approaches: Approach[];
  current: CatalogFilters;
}) {
  const geral = specialties.filter((s) => s.category !== "exterior");
  const exterior = specialties.filter((s) => s.category === "exterior");

  return (
    <form
      action="/psicologos"
      method="get"
      className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-background p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <div className="sm:col-span-2 lg:col-span-1">
        <Label htmlFor="q">Buscar</Label>
        <div className="flex items-center gap-2 rounded-lg border border-border px-2.5 focus-within:border-brand">
          <Search className="h-4 w-4 text-foreground-muted" />
          <input
            id="q"
            name="q"
            defaultValue={current.q ?? ""}
            placeholder="Nome, queixa..."
            className="h-10 w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="especialidade">Tema / queixa</Label>
        <Select id="especialidade" name="especialidade" defaultValue={current.especialidade ?? ""}>
          <option value="">Todos</option>
          <optgroup label="Gerais">
            {geral.map((s) => (
              <option key={s.id} value={s.slug}>{s.name}</option>
            ))}
          </optgroup>
          <optgroup label="Exterior">
            {exterior.map((s) => (
              <option key={s.id} value={s.slug}>{s.name}</option>
            ))}
          </optgroup>
        </Select>
      </div>

      <div>
        <Label htmlFor="abordagem">Abordagem</Label>
        <Select id="abordagem" name="abordagem" defaultValue={current.abordagem ?? ""}>
          <option value="">Todas</option>
          {approaches.map((a) => (
            <option key={a.id} value={a.slug}>{a.name}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="publico">Público</Label>
        <Select id="publico" name="publico" defaultValue={current.publico ?? ""}>
          <option value="">Todos</option>
          {AUDIENCES.map((a) => (
            <option key={a} value={a}>{AUDIENCE_LABELS[a]}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="formato">Formato</Label>
        <Select id="formato" name="formato" defaultValue={current.formato ?? ""}>
          <option value="">Online ou presencial</option>
          <option value="online">Online</option>
          <option value="presencial">Presencial</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="pais">Vive em (exterior)</Label>
        <Select id="pais" name="pais" defaultValue={current.pais ?? ""}>
          <option value="">Qualquer país</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="genero">Gênero do profissional</Label>
        <Select id="genero" name="genero" defaultValue={current.genero ?? ""}>
          <option value="">Indiferente</option>
          <option value="feminino">Feminino</option>
          <option value="masculino">Masculino</option>
          <option value="nao_binario">Não-binário</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="precoMax">Valor máximo (R$)</Label>
        <Input id="precoMax" name="precoMax" inputMode="numeric" defaultValue={current.precoMax ?? ""} placeholder="Ex.: 150" />
      </div>

      <label className="flex items-center gap-2 text-sm sm:col-span-2 sm:self-end sm:pb-2.5">
        <input
          type="checkbox"
          name="exterior"
          value="1"
          defaultChecked={!!current.exterior}
          className="h-4 w-4 accent-[var(--ayu-verde)]"
        />
        Só quem atende brasileiros no exterior
      </label>

      <div className="flex gap-2 sm:col-span-2 sm:self-end lg:col-span-3 xl:col-span-2 xl:justify-end">
        <Button type="submit" className="flex-1 xl:flex-none xl:px-8">Filtrar</Button>
        <Button href="/psicologos" variant="outline">Limpar</Button>
      </div>
    </form>
  );
}
