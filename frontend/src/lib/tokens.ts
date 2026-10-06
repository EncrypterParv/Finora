export const CATEGORY_TOKENS: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  "Food & Dining": {
    label: "Food & Dining",
    color: "#F59E0B",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: "Utensils",
  },
  Entertainment: {
    label: "Entertainment",
    color: "#8B5CF6",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: "Film",
  },
  Transportation: {
    label: "Transportation",
    color: "#3B82F6",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: "Car",
  },
  Shopping: {
    label: "Shopping",
    color: "#EC4899",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    icon: "ShoppingBag",
  },
  "Bills & Utilities": {
    label: "Bills & Utilities",
    color: "#EF4444",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    icon: "Zap",
  },
  Income: {
    label: "Income & Payroll",
    color: "#10B981",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: "ArrowDownLeft",
  },
  Investments: {
    label: "Investments & SIP",
    color: "#06B6D4",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    icon: "TrendingUp",
  },
  Personal: {
    label: "Personal Care",
    color: "#F43F5E",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    icon: "User",
  },
  General: {
    label: "General Expenses",
    color: "#64748B",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    icon: "Tag",
  },
};

export function getCategoryToken(categoryName: string) {
  return CATEGORY_TOKENS[categoryName] || CATEGORY_TOKENS.General;
}
