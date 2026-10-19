import Link from "next/link";
import { SurfaceMissing } from "@/components/surface/missing";

export default function TournamentNotFound() {
  return (
    <SurfaceMissing eyebrow="Матч" title="матч не найден" lead="Возможно, он ещё не создан, удалён или ссылка неверна.">
      <Link className="sf-btn sf-btn-amber" href="/schedule">
        К расписанию
      </Link>
      <Link className="sf-btn sf-btn-line" href="/archive">
        Архив матчей
      </Link>
    </SurfaceMissing>
  );
}
