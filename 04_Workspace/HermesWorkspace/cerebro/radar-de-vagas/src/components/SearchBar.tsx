import { categorias } from '../data/radarConfig';
import type { SearchMode } from '../types/opportunity';
import { urlParaModo } from '../data/radarConfig';

interface SearchBarProps {
  mode: SearchMode;
}

export function SearchBar({ mode }: SearchBarProps) {
  return (
    <section className="search-bar">
      <div className="search-row">
        {categorias.map(categoria => (
          <a
            key={categoria.id}
            className="search-chip"
            href={urlParaModo(categoria, mode)}
            target="_blank"
            rel="noreferrer"
          >
            {categoria.titulo}
          </a>
        ))}
      </div>
    </section>
  );
}
