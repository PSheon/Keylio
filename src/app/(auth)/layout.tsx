/**
 * Auth Layout
 *
 * 用於認證相關頁面（onboarding, unlock）
 * 不包含 Dashboard 的導航列
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
