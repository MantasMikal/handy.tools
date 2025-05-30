import Compressor from "@/features/compression/compressor";

export default function Dashboard() {
  return (
    <main className="grow mx-auto flex flex-col w-full p-4 md:p-6 max-w-screen-2xl md:max-h-[calc(100dvh-64px)]">
      <Compressor />
    </main>
  );
}
