import { Header } from "@/components/header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {/* Clear the bottom tab bar (50px + home-indicator inset) below `lg`. */}
      <main className="flex-1 pb-[calc(50px+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>
    </>
  );
}
