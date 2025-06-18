export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}