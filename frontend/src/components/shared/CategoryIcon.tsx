
import * as React from "react";
import {
  Microscope,
  Cpu,
  FlaskConical,
  Printer,
  Atom,
  Boxes,
} from "lucide-react";

// Module-level map so the icon reference is always stable (no component
// created during render). Unknown categories fall back to a neutral icon.
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  electronics: Cpu,
  "micro biology": Microscope,
  microbiology: Microscope,
  chemistry: FlaskConical,
  "bio chemistry": Atom,
  biochemistry: Atom,
  prototyping: Printer,
};

export function CategoryIcon({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const key = (category || "").toLowerCase();
  const Icon = ICONS[key] ?? Boxes;
  return <Icon className={className} />;
}
