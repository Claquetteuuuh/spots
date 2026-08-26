import { Header } from "@/components/header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
    </>
  );
}
