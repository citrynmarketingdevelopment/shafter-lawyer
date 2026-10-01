import Link from "next/link";
import { practiceGroups } from "@/lib/navigation";

export function PracticeDirectory() {
  return (
    <div className="directory-grid">
      {practiceGroups.map((group) => (
        <section className="directory-group" key={group.title}>
          <h2>{group.title}</h2>
          {group.items.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
              <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </section>
      ))}
    </div>
  );
}
