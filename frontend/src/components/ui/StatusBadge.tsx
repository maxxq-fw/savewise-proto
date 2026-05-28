import type { GoalStatus } from "../../types/goal";

const statusLabels: Record<GoalStatus, string> = {
  ACTIVE: "Активна",
  COMPLETED: "Завершена",
  CLOSED: "Закрыта"
};

const statusClasses: Record<GoalStatus, string> = {
  ACTIVE: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-red-50 text-red-700"
};

interface StatusBadgeProps {
  status: GoalStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-medium",
        statusClasses[status]
      ].join(" ")}
    >
      {statusLabels[status]}
    </span>
  );
}